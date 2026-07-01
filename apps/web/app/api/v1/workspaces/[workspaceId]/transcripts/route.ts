import { auth } from '@clerk/nextjs/server';
import { listTranscriptSources } from '@/lib/storage/library';

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    const data = await listTranscriptSources(workspaceId);

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Failed to list transcripts', error);
    return Response.json({ error: 'Failed to list transcripts' }, { status: 500 });
  }
}
