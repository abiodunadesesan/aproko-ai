import { NextResponse } from 'next/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { handleLiveContextSolveRequest } from '@/lib/live-context/solve-route';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

/**
 * Extension-friendly solve endpoint: resolves the caller's workspace server-side
 * so the background worker does not need a workspace id in the URL.
 */
export async function OPTIONS(request: Request) {
  return liveContextPreflightResponse(request);
}

export async function POST(request: Request) {
  const respond = (response: Response) => withLiveContextCors(response, request);

  const resolved = await resolveExtensionRequestAuth(request);
  const userId = resolved?.userId ?? null;
  if (!userId) {
    return respond(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const workspace =
    resolved?.source === 'extension-handoff' && resolved.handoff
      ? {
          workspaceId: resolved.handoff.workspaceId,
          name: resolved.handoff.workspaceName,
          role: resolved.handoff.role,
        }
      : await resolveWorkspaceForUser(userId);
  if (!workspace?.workspaceId) {
    return respond(NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }));
  }

  return handleLiveContextSolveRequest({
    request,
    userId,
    workspaceId: workspace.workspaceId,
  });
}
