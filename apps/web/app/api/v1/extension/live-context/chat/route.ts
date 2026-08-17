import { NextResponse } from 'next/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { streamLiveContextGeneration } from '@/lib/live-context/generation';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';
import { createLiveContextChatRouteHandlers } from '@/app/api/v1/workspaces/[workspaceId]/live-context/chat/route';

const workspaceChatHandlers = createLiveContextChatRouteHandlers({
  auth: async (request) => {
    const resolved = await resolveExtensionRequestAuth(request);
    return { userId: resolved?.userId ?? null };
  },
  streamLiveContextGeneration,
});

/**
 * Extension-friendly chat endpoint: resolves workspace from Clerk cookies or
 * extension handoff bearer token server-side.
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
    resolved.source === 'extension-handoff' && resolved.handoff
      ? {
          workspaceId: resolved.handoff.workspaceId,
          name: resolved.handoff.workspaceName,
          role: resolved.handoff.role,
        }
      : await resolveWorkspaceForUser(userId);

  if (!workspace?.workspaceId) {
    return respond(NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }));
  }

  return workspaceChatHandlers.POST(request, {
    params: Promise.resolve({ workspaceId: workspace.workspaceId }),
  });
}
