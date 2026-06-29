import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createStudySummary, type StudySummary } from '@/lib/storage/summaries';
import { getWorkspaceNoteById, listWorkspaceNotes } from '@/lib/storage/notes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type StudySummaryGenerateRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  createStudySummary: typeof createStudySummary;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

function toSummaryPayload(summary: StudySummary) {
  return {
    id: summary.id,
    workspaceId: summary.workspaceId,
    summaryType: summary.summaryType,
    title: summary.title,
    content: summary.content,
    sourceNoteId: summary.sourceNoteId,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  };
}

function sentenceParts(text: string): string[] {
  return text
    .split(/[.\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 24);
}

function compactSummary(sourceText: string): string {
  const sentences = sentenceParts(sourceText);
  const overview = sentences.slice(0, 2);
  const keyPoints = sentences.slice(2, 6);

  const lines: string[] = [];
  lines.push('## Overview');
  lines.push(overview.length ? overview.join('. ') + '.' : 'Study source captured.');
  lines.push('');
  lines.push('## Key Points');
  if (keyPoints.length) {
    for (const point of keyPoints) {
      lines.push(`- ${point}`);
    }
  } else {
    lines.push('- Add more detailed notes to improve summary quality.');
  }

  lines.push('');
  lines.push('## Next Review');
  lines.push('- Revisit this summary and convert key points into flashcards.');
  lines.push('- Validate understanding with a short quiz attempt.');

  return lines.join('\n');
}

export function createStudySummaryGenerateRouteHandlers(
  deps: StudySummaryGenerateRouteDependencies,
) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as { noteId?: string } | null;
      const noteId = rawBody?.noteId?.trim() ?? '';

      let sourceTitle = 'Workspace Study Summary';
      let sourceText = '';
      let sourceNoteId: string | null = null;

      if (noteId) {
        const note = await deps.getWorkspaceNoteById(workspaceId, noteId);
        if (!note) {
          return NextResponse.json({ error: 'Source note not found' }, { status: 404 });
        }
        sourceTitle = note.title;
        sourceText = note.content;
        sourceNoteId = note.id;
      } else {
        const notes = await deps.listWorkspaceNotes(workspaceId);
        if (!notes.length) {
          return NextResponse.json(
            { error: 'No workspace notes found for summary generation' },
            { status: 400 },
          );
        }
        sourceTitle = `${notes[0]?.title ?? 'Workspace'} Study Summary`;
        sourceText = notes
          .slice(0, 5)
          .map((note) => `${note.title}\n${note.content}`)
          .join('\n\n');
      }

      if (!sourceText.trim()) {
        return NextResponse.json({ error: 'Source content is empty' }, { status: 400 });
      }

      const summaryTitle = `Study Summary: ${sourceTitle}`.slice(0, 120);
      const summaryContent = compactSummary(sourceText);
      const summary = await deps.createStudySummary(
        workspaceId,
        summaryTitle,
        summaryContent,
        sourceNoteId,
      );
      if (!summary) {
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
      }

      return NextResponse.json({ data: toSummaryPayload(summary) }, { status: 201 });
    },
  };
}

export const { POST } = createStudySummaryGenerateRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listWorkspaceNotes,
  getWorkspaceNoteById,
  createStudySummary,
});
