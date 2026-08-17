import { NextResponse } from 'next/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

export async function OPTIONS(request: Request) {
  return liveContextPreflightResponse(request);
}

export async function GET(request: Request) {
  const respond = (response: Response) => withLiveContextCors(response, request);

  const resolved = await resolveExtensionRequestAuth(request);
  const userId = resolved?.userId ?? null;
  if (!userId) {
    return respond(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  if (resolved.source === 'extension-handoff' && resolved.handoff) {
    return respond(
      NextResponse.json({
        data: {
          workspaceId: resolved.handoff.workspaceId,
          name: resolved.handoff.workspaceName,
          role: resolved.handoff.role,
          source: 'extension-handoff',
        },
      }),
    );
  }

  const workspace = await resolveWorkspaceForUser(userId);
  if (!workspace?.workspaceId) {
    return respond(NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }));
  }

  return respond(
    NextResponse.json({
      data: {
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        role: workspace.role,
        source: 'clerk',
      },
    }),
  );
}
