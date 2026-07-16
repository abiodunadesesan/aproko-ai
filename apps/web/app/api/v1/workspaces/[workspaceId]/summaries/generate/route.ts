import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  generateSlideOutlineMarkdown,
  generateStudySummaryMarkdown,
} from '@/lib/ai/study-generation';
import { createStudySummary, type StudySummary } from '@/lib/storage/summaries';
import { getWorkspaceNoteById, listWorkspaceNotes } from '@/lib/storage/notes';
import { readLibrarySourceText } from '@/lib/storage/library';
import { resolveStudySourceContent } from '@/lib/study/resolve-source';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type StudySummaryGenerateRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  readLibrarySourceText: typeof readLibrarySourceText;
  createStudySummary: typeof createStudySummary;
  generateStudySummaryMarkdown: typeof generateStudySummaryMarkdown;
  generateSlideOutlineMarkdown: typeof generateSlideOutlineMarkdown;
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

export function createStudySummaryGenerateRouteHandlers(
  deps: StudySummaryGenerateRouteDependencies,
) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await context.params;
        const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
        if (forbidden) {
          return forbidden;
        }
        const rawBody = (await request.json().catch(() => null)) as {
          noteId?: string;
          sourceId?: string;
          kind?: 'summary' | 'outline';
        } | null;

        const kind = rawBody?.kind === 'outline' ? 'outline' : 'summary';

        let resolved;
        try {
          resolved = await resolveStudySourceContent(
            workspaceId,
            {
              noteId: rawBody?.noteId ?? null,
              sourceId: rawBody?.sourceId ?? null,
            },
            {
              getWorkspaceNoteById: deps.getWorkspaceNoteById,
              listWorkspaceNotes: deps.listWorkspaceNotes,
              readLibrarySourceText: deps.readLibrarySourceText,
            },
          );
        } catch (resolveError) {
          const message =
            resolveError instanceof Error ? resolveError.message : 'Unable to resolve study source';
          const status = message.includes('not found')
            ? 404
            : message.includes('No workspace notes')
              ? 400
              : 400;
          return NextResponse.json({ error: message }, { status });
        }

        if (!resolved.content.trim()) {
          return NextResponse.json({ error: 'Source content is empty' }, { status: 400 });
        }

        const content =
          kind === 'outline'
            ? await deps.generateSlideOutlineMarkdown(resolved.content)
            : await deps.generateStudySummaryMarkdown(resolved.content);

        const titlePrefix = kind === 'outline' ? 'Slide Outline' : 'Study Summary';
        const summaryTitle = `${titlePrefix}: ${resolved.title}`.slice(0, 120);
        const summary = await deps.createStudySummary(
          workspaceId,
          summaryTitle,
          content,
          resolved.sourceNoteId,
        );
        if (!summary) {
          return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
        }

        await trackServerEvent({
          event: kind === 'outline' ? 'slide_outline_generated' : 'study_summary_generated',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            note_id: resolved.sourceNoteId,
            source_id: resolved.sourceId,
          },
        });

        return NextResponse.json({ data: toSummaryPayload(summary) }, { status: 201 });
      } catch (error) {
        console.error('Failed to generate study summary', error);
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to generate summary',
          },
          { status: 500 },
        );
      }
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
  readLibrarySourceText,
  createStudySummary,
  generateStudySummaryMarkdown,
  generateSlideOutlineMarkdown,
});
