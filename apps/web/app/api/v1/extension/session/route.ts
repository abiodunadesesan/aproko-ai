import { NextResponse } from 'next/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { resolveEffectivePlanCode } from '@/lib/billing/plan-entitlements';
import { planIncludesLiveContext } from '@/lib/live-context/plan-access';
import { getBillingSubscription } from '@/lib/storage/billing';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

export async function OPTIONS(request: Request) {
  return liveContextPreflightResponse(request);
}

export async function GET(request: Request) {
  const respond = (response: Response) => withLiveContextCors(response, request);

  try {
    const resolved = await resolveExtensionRequestAuth(request);
    const userId = resolved?.userId ?? null;
    if (!userId) {
      const hasExtensionToken =
        Boolean(request.headers.get('x-aproko-extension-token')?.trim()) ||
        Boolean(request.headers.get('Authorization')?.trim()?.startsWith('Bearer ext.'));
      if (hasExtensionToken) {
        return respond(
          NextResponse.json(
            {
              error:
                'Invalid or expired extension handoff token. Open /extension/connect and reload the panel.',
            },
            { status: 401 },
          ),
        );
      }
      return respond(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const source = resolved?.source ?? null;
    const handoff = resolved?.handoff ?? null;

    if (source === 'extension-handoff' && handoff) {
      try {
        const subscription = await getBillingSubscription(handoff.workspaceId);
        const planCode = resolveEffectivePlanCode(subscription);
        return respond(
          NextResponse.json({
            data: {
              workspaceId: handoff.workspaceId,
              name: handoff.workspaceName,
              role: handoff.role,
              source: 'extension-handoff',
              planCode,
              liveContextCompanion: planIncludesLiveContext(planCode),
            },
          }),
        );
      } catch {
        return respond(
          NextResponse.json({
            data: {
              workspaceId: handoff.workspaceId,
              name: handoff.workspaceName,
              role: handoff.role,
              source: 'extension-handoff',
              planCode: 'free',
              liveContextCompanion: planIncludesLiveContext('free'),
            },
          }),
        );
      }
    }

    const workspace = await resolveWorkspaceForUser(userId);
    if (!workspace?.workspaceId) {
      return respond(NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }));
    }

    const subscription = await getBillingSubscription(workspace.workspaceId);
    const planCode = resolveEffectivePlanCode(subscription);

    return respond(
      NextResponse.json({
        data: {
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          role: workspace.role,
          source: 'clerk',
          planCode,
          liveContextCompanion: planIncludesLiveContext(planCode),
        },
      }),
    );
  } catch (error) {
    return respond(
      NextResponse.json(
        {
          error: 'extension_session_crash',
          detail: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      ),
    );
  }
}
