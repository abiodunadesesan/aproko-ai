import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceNote,
  getWorkspaceNoteById,
  updateWorkspaceNote,
  type WorkspaceNote,
} from '@/lib/storage/notes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type NoteByIdRouteDependencies = {
  auth: AuthDependency;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  updateWorkspaceNote: typeof updateWorkspaceNote;
  deleteWorkspaceNote: typeof deleteWorkspaceNote;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; noteId: string }>;
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

export function createNoteByIdRouteHandlers(deps: NoteByIdRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, noteId } = await context.params;
      const note = await deps.getWorkspaceNoteById(workspaceId, noteId);
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      return NextResponse.json({ data: toNotePayload(note) });
    },

    PATCH: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, noteId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        content?: string;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const content = rawBody?.content?.trim() ?? '';
      if (!title && !content) {
        return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
      }

      const updated = await deps.updateWorkspaceNote(workspaceId, noteId, title, content);
      if (!updated) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      return NextResponse.json({ data: toNotePayload(updated) });
    },

    DELETE: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, noteId } = await context.params;
      const deleted = await deps.deleteWorkspaceNote(workspaceId, noteId);
      if (!deleted) {
        return NextResponse.json({ error: 'Note not found or delete failed' }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    },
  };
}

export const { GET, PATCH, DELETE } = createNoteByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getWorkspaceNoteById,
  updateWorkspaceNote,
  deleteWorkspaceNote,
});
