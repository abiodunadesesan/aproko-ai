import { NextResponse } from 'next/server';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';
import {
  consumeAiQueryQuota,
  planQuotaExceededResponse,
} from '@/lib/billing/plan-usage';
import {
  assertLiveContextCompanionAccess,
  liveContextProRequiredResponse,
} from '@/lib/live-context/plan-access';
import { persistLiveCaptureAsSource } from '@/lib/live-context/persist-capture-source';
import { withLiveContextCors } from '@/lib/live-context/cors';
import { canGenerateLiveContext, resolveLiveContextModel } from '@/lib/live-context/generation';
import {
  sanitizeLiveBrowserContext,
  type LiveBrowserContextInput,
} from '@/lib/live-context/sanitize';
import { generateLiveSolve } from '@/lib/live-context/solve';
import { trackServerEvent } from '@/lib/observability/server';

export async function handleLiveContextSolveRequest(input: {
  request: Request;
  userId: string;
  workspaceId: string;
}): Promise<Response> {
  const respond = (response: Response) => withLiveContextCors(response, input.request);

  const rateLimitResponse = await enforceRateLimit({
    request: input.request,
    userId: input.userId,
    policy: rateLimitPolicies.liveContextWrite,
  });
  if (rateLimitResponse) {
    return respond(rateLimitResponse);
  }

  const forbidden = await forbidUnlessWorkspaceMember(input.userId, input.workspaceId);
  if (forbidden) {
    return respond(forbidden);
  }

  const rawBody = (await input.request.json().catch(() => null)) as
    | (LiveBrowserContextInput & { model?: string; persistCapture?: boolean })
    | null;

  const planAccess = await assertLiveContextCompanionAccess(input.workspaceId);
  if (!planAccess.allowed) {
    return respond(liveContextProRequiredResponse(planAccess.message, planAccess.planCode));
  }

  const withDefaultQuery: LiveBrowserContextInput = {
    ...(rawBody ?? {}),
    userQuery:
      (typeof rawBody?.userQuery === 'string' && rawBody.userQuery.trim()) ||
      'Solve the clicked question using the full page and cursor focus.',
  };

  const sanitized = sanitizeLiveBrowserContext(withDefaultQuery);
  if (!sanitized.ok) {
    return respond(NextResponse.json({ error: sanitized.error }, { status: 400 }));
  }

  const model = resolveLiveContextModel(rawBody?.model);
  if (!model || !canGenerateLiveContext(model)) {
    return respond(
      NextResponse.json(
        {
          error:
            'No chat model is configured. Set GROQ_API_KEY (recommended) in apps/web/.env.local.',
        },
        { status: 503 },
      ),
    );
  }

  const quota = await consumeAiQueryQuota(input.workspaceId);
  if (!quota.allowed) {
    return respond(planQuotaExceededResponse(quota.message, quota.usage));
  }

  try {
    let savedSource: { sourceId: string; name: string } | null = null;
    if (rawBody?.persistCapture === true) {
      savedSource = await persistLiveCaptureAsSource(input.workspaceId, sanitized.context);
    }

    const solve = await generateLiveSolve({
      model,
      context: sanitized.context,
    });

    await trackServerEvent({
      event: 'live_context_solve_requested',
      distinctId: input.userId,
      properties: {
        workspace_id: input.workspaceId,
        model,
        kind: solve.kind,
        has_hover: Boolean(sanitized.context.activeHoverContext),
      },
    });

    return respond(
      NextResponse.json({
        data: {
          ...solve,
          model,
          savedSource,
        },
      }),
    );
  } catch (error) {
    console.error('[live-context/solve]', error);
    return respond(
      NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unable to solve this question',
        },
        { status: 502 },
      ),
    );
  }
}
