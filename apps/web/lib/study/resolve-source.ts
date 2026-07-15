import { getWorkspaceNoteById, listWorkspaceNotes } from '@/lib/storage/notes';
import { readLibrarySourceText } from '@/lib/storage/library';

export type StudySourceContent = {
  title: string;
  content: string;
  sourceNoteId: string | null;
  sourceId: string | null;
};

type ResolveStudySourceDeps = {
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  readLibrarySourceText: typeof readLibrarySourceText;
};

export async function resolveStudySourceContent(
  workspaceId: string,
  input: { noteId?: string | null; sourceId?: string | null },
  deps: ResolveStudySourceDeps = {
    getWorkspaceNoteById,
    listWorkspaceNotes,
    readLibrarySourceText,
  },
): Promise<StudySourceContent> {
  const noteId = input.noteId?.trim() || '';
  const sourceId = input.sourceId?.trim() || '';

  if (noteId && sourceId) {
    throw new Error('Provide either noteId or sourceId, not both');
  }

  if (noteId) {
    const note = await deps.getWorkspaceNoteById(workspaceId, noteId);
    if (!note) {
      throw new Error('Source note not found');
    }
    return {
      title: note.title,
      content: note.content,
      sourceNoteId: note.id,
      sourceId: null,
    };
  }

  if (sourceId) {
    const source = await deps.readLibrarySourceText(workspaceId, sourceId);
    if (!source) {
      throw new Error('Source transcript not found');
    }
    return {
      title: source.title,
      content: source.content,
      sourceNoteId: null,
      sourceId: source.sourceId,
    };
  }

  const notes = await deps.listWorkspaceNotes(workspaceId);
  if (!notes.length) {
    throw new Error('No workspace notes found for generation');
  }

  return {
    title: `${notes[0]?.title ?? 'Workspace'} Study Pack`,
    content: notes
      .slice(0, 5)
      .map((note) => `${note.title}\n${note.content}`)
      .join('\n\n'),
    sourceNoteId: notes[0]?.id ?? null,
    sourceId: null,
  };
}
