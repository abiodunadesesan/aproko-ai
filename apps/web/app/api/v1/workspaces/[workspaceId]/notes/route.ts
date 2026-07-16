import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createWorkspaceNote, listWorkspaceNotes, type WorkspaceNote } from '@/lib/storage/notes';
import { withPerformanceHeaders } from '@/lib/perf/http';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type NotesRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  createWorkspaceNote: typeof createWorkspaceNote;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

function toNotePayload(note: WorkspaceNote) {
  return {
    id: note.id,
    workspaceId: note.workspaceId,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function createNotesRouteHandlers(deps: NotesRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const startedAtMs = Date.now();
      const { userId } = await deps.auth();
      if (!userId) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const notes = await deps.listWorkspaceNotes(workspaceId);
      return withPerformanceHeaders(
        NextResponse.json({ data: notes.map(toNotePayload) }),
        startedAtMs,
        {
          cacheControl: 'private, max-age=20, stale-while-revalidate=90',
        },
      );
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.notesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        content?: string;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const content = rawBody?.content?.trim() ?? '';

      if (!title && !content) {
        return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
      }

      const created = await deps.createWorkspaceNote(workspaceId, title, content);
      if (!created) {
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
      }

      await trackServerEvent({
        event: 'note_created',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          note_id: created.id,
          has_title: Boolean(title),
          has_content: Boolean(content),
        },
      });

      return NextResponse.json({ data: toNotePayload(created) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createNotesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listWorkspaceNotes,
  createWorkspaceNote,
});
