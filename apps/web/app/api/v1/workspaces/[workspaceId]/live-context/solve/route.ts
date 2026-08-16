import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
import { canGenerateLiveContext, resolveLiveContextModel } from '@/lib/live-context/generation';
import {
  sanitizeLiveBrowserContext,
  type LiveBrowserContextInput,
} from '@/lib/live-context/sanitize';
import { generateLiveSolve } from '@/lib/live-context/solve';
import { trackServerEvent } from '@/lib/observability/server';

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function OPTIONS(request: Request) {
  return liveContextPreflightResponse(request);
}

export async function POST(request: Request, context: RouteContext) {
  const respond = (response: Response) => withLiveContextCors(response, request);

  const { userId } = await auth();
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
    | (LiveBrowserContextInput & { model?: string })
    | null;

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

  const quota = await consumeAiQueryQuota(workspaceId);
  if (!quota.allowed) {
    return respond(planQuotaExceededResponse(quota.message, quota.usage));
  }

  try {
    const solve = await generateLiveSolve({
      model,
      context: sanitized.context,
    });

    await trackServerEvent({
      event: 'live_context_solve_requested',
      distinctId: userId,
      properties: {
        workspace_id: workspaceId,
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
        },
      }),
    );
  } catch (error) {
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
