import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createChatMessage,
  getChatSessionById,
  listChatMessages,
  type ChatMessage,
} from '@/lib/storage/chat';
import { listMemoryItems, type MemoryItem } from '@/lib/storage/memory';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ChatMessagesRouteDependencies = {
  auth: AuthDependency;
  getChatSessionById: typeof getChatSessionById;
  listChatMessages: typeof listChatMessages;
  createChatMessage: typeof createChatMessage;
  listMemoryItems: typeof listMemoryItems;
};

type RouteContext = { params: Promise<{ workspaceId: string; sessionId: string }> };
type SseEventName = 'start' | 'delta' | 'done' | 'error';
type ChatModel = 'openai:gpt-4o-mini' | 'anthropic:claude-3-5-sonnet' | 'google:gemini-1.5-pro';
type ChatCitation = {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'workspace-source';
};
type ChatMemoryContext = {
  memoryItemId: string;
  memoryType: MemoryItem['memoryType'];
  summary: string;
  rankScore: number;
};
const DEFAULT_CHAT_MODEL: ChatModel = 'openai:gpt-4o-mini';

function isChatModel(value: string): value is ChatModel {
  return ['openai:gpt-4o-mini', 'anthropic:claude-3-5-sonnet', 'google:gemini-1.5-pro'].includes(
    value,
  );
}

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
  text: string,
  citations: ChatCitation[],
  model: ChatModel,
  memoryContext: ChatMemoryContext[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 24;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let eventId = 0;
      const enqueue = (event: SseEventName, payload: object) => {
        eventId += 1;
        controller.enqueue(encoder.encode(toSseBlock(eventId, event, payload)));
      };

      const run = () => {
        enqueue('start', {
          transport: 'sse',
          version: 1,
          model,
          memoryContext,
        });

        for (let index = 0; index < chunks.length; index += 1) {
          enqueue('delta', {
            index,
            content: chunks[index],
          });
        }

        enqueue('done', {
          totalChunks: chunks.length,
          citations,
          model,
          memoryContext,
        });
        controller.close();
      };

      try {
        run();
      } catch {
        enqueue('error', {
          code: 'STREAM_FAILED',
          message: 'Unable to stream assistant response',
        });
        controller.close();
      }
    },
  });
}

function memoryRecencyScore(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  const ageHours = Math.max(0, (Date.now() - parsed) / 3_600_000);
  return Math.exp(-ageHours / 72);
}

function selectMemoryContext(items: MemoryItem[]): ChatMemoryContext[] {
  return items
    .map((item) => {
      const importance = item.importanceScore ?? 0.5;
      const recency = memoryRecencyScore(item.updatedAt);
      const rankScore = Number((importance * 0.6 + recency * 0.4).toFixed(4));
      return {
        memoryItemId: item.id,
        memoryType: item.memoryType,
        summary: item.summary,
        rankScore,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 3);
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
      const session = await deps.getChatSessionById(workspaceId, userId, sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as {
        content?: string;
        model?: string;
      } | null;
      const content = rawBody?.content?.trim() ?? '';
      const modelRaw = rawBody?.model?.trim() ?? DEFAULT_CHAT_MODEL;

      if (!content) {
        return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      }

      if (!isChatModel(modelRaw)) {
        return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
      }

      const userMessage = await deps.createChatMessage(workspaceId, sessionId, 'user', content, {
        responseTransport: 'sse',
        model: modelRaw,
        status: 'completed',
        metadata: {
          source: 'user',
        },
      });
      if (!userMessage) {
        return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
      }

      const assistantText = `Model ${modelRaw} response: I received "${content}". Streaming and citations are active placeholders for Sprint 3 baseline.`;
      const memoryContext = selectMemoryContext(await deps.listMemoryItems(workspaceId));
      const memoryContextText = memoryContext.length
        ? ` Memory context: ${memoryContext.map((item) => item.summary).join(' | ')}`
        : ' Memory context: none selected.';
      const assistantTextWithMemory = `${assistantText}${memoryContextText}`;
      const citations: ChatCitation[] = [
        {
          id: 'workspace-source-1',
          title: 'Workspace Context Snapshot',
          snippet:
            'This response is grounded in workspace-scoped context for citation contract validation.',
          sourceType: 'workspace-source',
        },
      ];
      const assistantMessage = await deps.createChatMessage(
        workspaceId,
        sessionId,
        'assistant',
        assistantTextWithMemory,
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
        return NextResponse.json({ error: 'Failed to save assistant message' }, { status: 500 });
      }

      return new Response(
        streamAssistantResponse(assistantTextWithMemory, citations, modelRaw, memoryContext),
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
});
