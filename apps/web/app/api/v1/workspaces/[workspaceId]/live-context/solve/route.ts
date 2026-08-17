import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { handleLiveContextSolveRequest } from '@/lib/live-context/solve-route';

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

  const { workspaceId } = await context.params;
  if (!workspaceId?.trim()) {
    return respond(NextResponse.json({ error: 'workspaceId is required' }, { status: 400 }));
  }

  return handleLiveContextSolveRequest({
    request,
    userId,
    workspaceId: workspaceId.trim(),
  });
}
