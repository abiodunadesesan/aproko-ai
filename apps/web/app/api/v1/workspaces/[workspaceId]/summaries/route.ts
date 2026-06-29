import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createStudySummary, listStudySummaries, type StudySummary } from '@/lib/storage/summaries';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type StudySummariesRouteDependencies = {
  auth: AuthDependency;
  listStudySummaries: typeof listStudySummaries;
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

export function createStudySummariesRouteHandlers(deps: StudySummariesRouteDependencies) {
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
      const summaries = await deps.listStudySummaries(workspaceId);
      return withPerformanceHeaders(
        NextResponse.json({ data: summaries.map(toSummaryPayload) }),
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

      const { workspaceId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        content?: string;
        sourceNoteId?: string | null;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const content = rawBody?.content?.trim() ?? '';
      if (!title || !content) {
        return NextResponse.json(
          { error: 'Summary title and content are required' },
          { status: 400 },
        );
      }

      const summary = await deps.createStudySummary(
        workspaceId,
        title,
        content,
        rawBody?.sourceNoteId ?? null,
      );
      if (!summary) {
        return NextResponse.json({ error: 'Failed to create summary' }, { status: 500 });
      }

      return NextResponse.json({ data: toSummaryPayload(summary) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createStudySummariesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listStudySummaries,
  createStudySummary,
});
