import { NextResponse } from 'next/server';
import type { ChatModel } from '@/lib/ai/chat-models';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';
import {
  consumeAiQueryQuota,
  planQuotaExceededResponse,
} from '@/lib/billing/plan-usage';
import {
  liveContextPreflightResponse,
  withLiveContextCors,
} from '@/lib/live-context/cors';
import {
  canGenerateLiveContext,
  resolveLiveContextModel,
  streamLiveContextGeneration,
} from '@/lib/live-context/generation';
import {
  sanitizeLiveBrowserContext,
  type LiveBrowserContextInput,
  type SanitizedLiveBrowserContext,
} from '@/lib/live-context/sanitize';
import {
  assertLiveContextCompanionAccess,
  liveContextProRequiredResponse,
  type LiveContextPlanAccess,
} from '@/lib/live-context/plan-access';
import { persistLiveCaptureAsSource } from '@/lib/live-context/persist-capture-source';
import { trackServerEvent } from '@/lib/observability/server';
import type { ChatGenerationStream } from '@/lib/ai/chat-generation';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';

type AuthDependency = (request: Request) => Promise<{ userId: string | null }>;

type LiveContextChatDependencies = {
  auth: AuthDependency;
  streamLiveContextGeneration: (input: {
    model: ChatModel;
    context: SanitizedLiveBrowserContext;
  }) => ChatGenerationStream;
  consumeAiQueryQuota?: typeof consumeAiQueryQuota;
  assertLiveContextCompanionAccess?: (
    workspaceId: string,
  ) => Promise<LiveContextPlanAccess>;
  persistLiveCaptureAsSource?: typeof persistLiveCaptureAsSource;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };
type SseEventName = 'start' | 'delta' | 'done' | 'error';

function toSseBlock(eventId: number, event: SseEventName, payload: object): string {
  return `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function streamLiveContextResponse(
  generation: ChatGenerationStream,
  model: ChatModel,
  meta: {
    url: string;
    title: string;
    truncated: boolean;
    savedSource?: { sourceId: string; name: string } | null;
  },
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
          liveContext: meta,
          savedSource: meta.savedSource ?? null,
        });

        let buffered = '';
        let deltaIndex = 0;
        let sawDelta = false;

        for await (const chunk of generation.textStream) {
          buffered += chunk;
          while (buffered.length >= chunkSize) {
            const content = buffered.slice(0, chunkSize);
            buffered = buffered.slice(chunkSize);
            enqueue('delta', { index: deltaIndex, content });
            deltaIndex += 1;
            sawDelta = true;
          }
        }

        if (buffered.length > 0) {
          enqueue('delta', { index: deltaIndex, content: buffered });
          deltaIndex += 1;
          sawDelta = true;
        }

        const fullText = (await generation.fullText).trim();
        if (!fullText) {
          throw new Error(
            sawDelta
              ? 'Model returned an empty response'
              : 'Model returned no text. Check provider API keys/credits (prefer GROQ_API_KEY), then try again.',
          );
        }

        enqueue('done', {
          totalChunks: deltaIndex,
          model,
          liveContext: meta,
        });
        controller.close();
      } catch (error) {
        enqueue('error', {
          code: 'STREAM_FAILED',
          message: error instanceof Error ? error.message : 'Unable to stream live context response',
        });
        controller.close();
      }
    },
  });
}

export function createLiveContextChatRouteHandlers(deps: LiveContextChatDependencies) {
  return {
    OPTIONS: async (request: Request) => liveContextPreflightResponse(request),

    POST: async (request: Request, context: RouteContext) => {
      const respond = (response: Response) => withLiveContextCors(response, request);

      const { userId } = await deps.auth(request);
      if (!userId) {
        return respond(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.liveContextWrite,
      });
      if (rateLimitResponse) {
        return respond(rateLimitResponse);
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return respond(forbidden);
      }

      const rawBody = (await request.json().catch(() => null)) as
        | (LiveBrowserContextInput & { model?: string; persistCapture?: boolean })
        | null;

      const planAccess = await (deps.assertLiveContextCompanionAccess ?? assertLiveContextCompanionAccess)(
        workspaceId,
      );
      if (!planAccess.allowed) {
        return respond(liveContextProRequiredResponse(planAccess.message, planAccess.planCode));
      }

      const sanitized = sanitizeLiveBrowserContext(rawBody ?? {});
      if (!sanitized.ok) {
        return respond(NextResponse.json({ error: sanitized.error }, { status: 400 }));
      }

      const modelRaw = resolveLiveContextModel(rawBody?.model);
      if (!modelRaw || !canGenerateLiveContext(modelRaw)) {
        return respond(
          NextResponse.json(
            {
              error:
                'No chat model is configured. Set GROQ_API_KEY (recommended) or another provider key in apps/web/.env.local.',
            },
            { status: 503 },
          ),
        );
      }

      const quota = await (deps.consumeAiQueryQuota ?? consumeAiQueryQuota)(workspaceId);
      if (!quota.allowed) {
        return respond(planQuotaExceededResponse(quota.message, quota.usage));
      }

      await trackServerEvent({
        event: 'live_context_chat_requested',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          model: modelRaw,
          page_text_truncated: sanitized.context.truncated,
          persist_capture: rawBody?.persistCapture === true,
          page_host: (() => {
            try {
              return new URL(sanitized.context.url).host;
            } catch {
              return 'invalid';
            }
          })(),
        },
      });

      let savedSource: { sourceId: string; name: string } | null = null;
      if (rawBody?.persistCapture === true) {
        savedSource = await (deps.persistLiveCaptureAsSource ?? persistLiveCaptureAsSource)(
          workspaceId,
          sanitized.context,
        );
      }

      const generation = deps.streamLiveContextGeneration({
        model: modelRaw,
        context: sanitized.context,
      });

      return respond(
        new Response(
          streamLiveContextResponse(generation, modelRaw, {
            url: sanitized.context.url,
            title: sanitized.context.title,
            truncated: sanitized.context.truncated,
            savedSource,
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Aproko-Stream-Transport': 'sse',
              'X-Aproko-Live-Context': '1',
            },
          },
        ),
      );
    },
  };
}

export const { OPTIONS, POST } = createLiveContextChatRouteHandlers({
  auth: async (request) => {
    const resolved = await resolveExtensionRequestAuth(request);
    return { userId: resolved?.userId ?? null };
  },
  streamLiveContextGeneration,
});
