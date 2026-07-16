import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  buildWorkspaceContext,
  selectMemoryContext,
  workspaceContextToCitations,
  type ChatCitation,
  type ChatMemoryContext,
} from '@/lib/ai/chat-context';
import {
  canGenerateWithModel,
  streamAssistantGeneration,
  type ChatGenerationInput,
  type ChatGenerationStream,
} from '@/lib/ai/chat-generation';
import { isChatModel, type ChatModel } from '@/lib/ai/chat-models';
import {
  createChatMessage,
  getChatSessionById,
  listChatMessages,
  type ChatMessage,
} from '@/lib/storage/chat';
import { createMemoryItem, listMemoryItems } from '@/lib/storage/memory';
import { getProfileByClerkUserId } from '@/lib/auth/profile-sync';
import { captureChatMemoriesFromMessage } from '@/lib/memory/chat-capture';
import { normalizeUserPreferences } from '@/lib/settings/preferences';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ChatMessagesRouteDependencies = {
  auth: AuthDependency;
  getChatSessionById: typeof getChatSessionById;
  listChatMessages: typeof listChatMessages;
  createChatMessage: typeof createChatMessage;
  listMemoryItems: typeof listMemoryItems;
  createMemoryItem: typeof createMemoryItem;
  getProfileByClerkUserId: typeof getProfileByClerkUserId;
  captureChatMemoriesFromMessage: typeof captureChatMemoriesFromMessage;
  buildWorkspaceContext: typeof buildWorkspaceContext;
  streamAssistantGeneration: (input: ChatGenerationInput) => ChatGenerationStream;
};

type RouteContext = { params: Promise<{ workspaceId: string; sessionId: string }> };
type SseEventName = 'start' | 'delta' | 'done' | 'error';
const DEFAULT_CHAT_MODEL: ChatModel = 'openai:gpt-4o-mini';

function toMessagePayload(message: ChatMessage) {
  return {
    id: message.id,
    workspaceId: message.workspaceId,
    sessionId: message.sessionId,
    role: message.role,
    content: message.content,
    responseTransport: message.responseTransport,
    modelProvider: message.modelProvider,
    modelName: message.modelName,
    status: message.status,
    metadata: message.metadata,
    createdAt: message.createdAt,
  };
}

function toSseBlock(eventId: number, event: SseEventName, payload: object): string {
  return `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function streamAssistantResponse(
  generation: ChatGenerationStream,
  citations: ChatCitation[],
  model: ChatModel,
  memoryContext: ChatMemoryContext[],
  persistAssistantMessage: (fullText: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 24;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let eventId = 0;
      const enqueue = (event: SseEventName, payload: object) => {
        eventId += 1;
        controller.enqueue(encoder.encode(toSseBlock(eventId, event, payload)));
      };

      try {
        enqueue('start', {
          transport: 'sse',
          version: 1,
          model,
          memoryContext,
        });

        let buffered = '';
        let deltaIndex = 0;

        for await (const chunk of generation.textStream) {
          buffered += chunk;
          while (buffered.length >= chunkSize) {
            const content = buffered.slice(0, chunkSize);
            buffered = buffered.slice(chunkSize);
            enqueue('delta', { index: deltaIndex, content });
            deltaIndex += 1;
          }
        }

        if (buffered.length > 0) {
          enqueue('delta', { index: deltaIndex, content: buffered });
          deltaIndex += 1;
        }

        const fullText = (await generation.fullText).trim();
        if (!fullText) {
          throw new Error('Model returned an empty response');
        }

        await persistAssistantMessage(fullText);

        enqueue('done', {
          totalChunks: deltaIndex,
          citations,
          model,
          memoryContext,
        });
        controller.close();
      } catch (error) {
        enqueue('error', {
          code: 'STREAM_FAILED',
          message: error instanceof Error ? error.message : 'Unable to stream assistant response',
        });
        controller.close();
      }
    },
  });
}

export function createChatMessagesRouteHandlers(deps: ChatMessagesRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request: _request,
        userId,
        policy: rateLimitPolicies.chatMessagesRead,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, sessionId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const session = await deps.getChatSessionById(workspaceId, userId, sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const messages = await deps.listChatMessages(workspaceId, userId, sessionId);

      return NextResponse.json({
        data: messages.map(toMessagePayload),
      });
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.chatMessagesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, sessionId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const session = await deps.getChatSessionById(workspaceId, userId, sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as {
        content?: string;
        model?: string;
        sourceId?: string;
      } | null;
      const content = rawBody?.content?.trim() ?? '';
      const modelRaw = rawBody?.model?.trim() ?? DEFAULT_CHAT_MODEL;
      const preferredSourceId = rawBody?.sourceId?.trim() || undefined;

      if (!content) {
        return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      }

      if (!isChatModel(modelRaw)) {
        return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
      }

      if (!canGenerateWithModel(modelRaw)) {
        return NextResponse.json(
          {
            error: `Model ${modelRaw} is not configured. Add the provider API key in server environment variables.`,
          },
          { status: 503 },
        );
      }

      const userMessage = await deps.createChatMessage(workspaceId, sessionId, 'user', content, {
        responseTransport: 'sse',
        model: modelRaw,
        status: 'completed',
        metadata: {
          source: 'user',
          ...(preferredSourceId ? { preferredSourceId } : {}),
        },
      });
      if (!userMessage) {
        return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
      }

      try {
        const profile = await deps.getProfileByClerkUserId(userId);
        const autoMemoryCapture = normalizeUserPreferences(profile?.preferences).autoMemoryCapture;
        const capturedCount = await deps.captureChatMemoriesFromMessage({
          workspaceId,
          messageId: userMessage.id,
          content,
          autoMemoryCapture,
          createMemoryItem: deps.createMemoryItem,
        });
        if (capturedCount > 0) {
          await trackServerEvent({
            event: 'chat_memory_captured',
            distinctId: userId,
            properties: {
              workspace_id: workspaceId,
              session_id: sessionId,
              captured_count: capturedCount,
              auto_memory_capture: autoMemoryCapture,
            },
          });
        }
      } catch (captureError) {
        console.warn('Chat memory capture skipped due to error.', captureError);
      }

      const memoryContext = selectMemoryContext(await deps.listMemoryItems(workspaceId));
      const workspaceContext = await deps.buildWorkspaceContext(
        workspaceId,
        content,
        preferredSourceId ? { preferredSourceId } : undefined,
      );
      const citations = workspaceContextToCitations(workspaceContext);
      const priorMessages = await deps.listChatMessages(workspaceId, userId, sessionId);
      const history = priorMessages
        .filter((message) => message.id !== userMessage.id)
        .slice(-12)
        .flatMap((message) => {
          if (message.role !== 'user' && message.role !== 'assistant') {
            return [];
          }
          return [{ role: message.role, content: message.content }];
        });

      const generation = deps.streamAssistantGeneration({
        model: modelRaw,
        userMessage: content,
        history,
        memoryContext,
        workspaceContext,
      });

      const persistAssistantMessage = async (fullText: string) => {
        const assistantMessage = await deps.createChatMessage(
          workspaceId,
          sessionId,
          'assistant',
          fullText,
          {
            responseTransport: 'sse',
            model: modelRaw,
            status: 'completed',
            metadata: {
              citations,
              memoryContext,
            },
          },
        );
        if (!assistantMessage) {
          throw new Error('Failed to save assistant message');
        }

        await trackServerEvent({
          event: 'chat_message_sent',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            session_id: sessionId,
            model: modelRaw,
            memory_context_count: memoryContext.length,
            citation_count: citations.length,
          },
        });
      };

      return new Response(
        streamAssistantResponse(
          generation,
          citations,
          modelRaw,
          memoryContext,
          persistAssistantMessage,
        ),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Aproko-Stream-Transport': 'sse',
          },
        },
      );
    },
  };
}

export const { GET, POST } = createChatMessagesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getChatSessionById,
  listChatMessages,
  createChatMessage,
  listMemoryItems,
  createMemoryItem,
  getProfileByClerkUserId,
  captureChatMemoriesFromMessage,
  buildWorkspaceContext,
  streamAssistantGeneration,
});
