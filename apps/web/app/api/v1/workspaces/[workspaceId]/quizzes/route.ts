import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createQuiz, listQuizzes, type Quiz } from '@/lib/storage/quizzes';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizzesRouteDependencies = {
  auth: AuthDependency;
  listQuizzes: typeof listQuizzes;
  createQuiz: typeof createQuiz;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

function toQuizPayload(quiz: Quiz) {
  return {
    id: quiz.id,
    workspaceId: quiz.workspaceId,
    title: quiz.title,
    sourceNoteId: quiz.sourceNoteId,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

export function createQuizzesRouteHandlers(deps: QuizzesRouteDependencies) {
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
      const quizzes = await deps.listQuizzes(workspaceId);
      return withPerformanceHeaders(
        NextResponse.json({ data: quizzes.map(toQuizPayload) }),
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

      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        sourceNoteId?: string | null;
      } | null;
      const title = rawBody?.title?.trim() ?? '';
      if (!title) {
        return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 });
      }

      const { workspaceId } = await context.params;
      const quiz = await deps.createQuiz(workspaceId, title, rawBody?.sourceNoteId ?? null);
      if (!quiz) {
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
      }

      return NextResponse.json({ data: toQuizPayload(quiz) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createQuizzesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listQuizzes,
  createQuiz,
});
