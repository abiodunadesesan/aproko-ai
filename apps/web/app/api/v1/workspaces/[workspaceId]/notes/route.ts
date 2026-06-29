import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createWorkspaceNote, listWorkspaceNotes, type WorkspaceNote } from '@/lib/storage/notes';

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
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const notes = await deps.listWorkspaceNotes(workspaceId);
      return NextResponse.json({ data: notes.map(toNotePayload) });
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
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
