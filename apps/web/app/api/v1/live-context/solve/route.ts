import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
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

  const { userId } = await auth();
  if (!userId) {
    return respond(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const workspace = await resolveWorkspaceForUser(userId);
  if (!workspace?.workspaceId) {
    return respond(NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }));
  }

  return handleLiveContextSolveRequest({
    request,
    userId,
    workspaceId: workspace.workspaceId,
  });
}
