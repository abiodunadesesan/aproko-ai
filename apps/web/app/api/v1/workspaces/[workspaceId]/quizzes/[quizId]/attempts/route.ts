import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createQuizAttempt,
  getQuizById,
  listQuizAttempts,
  type QuizAnswerInput,
  type QuizAttempt,
} from '@/lib/storage/quizzes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizAttemptsRouteDependencies = {
  auth: AuthDependency;
  getQuizById: typeof getQuizById;
  listQuizAttempts: typeof listQuizAttempts;
  createQuizAttempt: typeof createQuizAttempt;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; quizId: string }>;
};

function toAttemptPayload(attempt: QuizAttempt) {
  return {
    id: attempt.id,
    workspaceId: attempt.workspaceId,
    quizId: attempt.quizId,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    createdAt: attempt.createdAt,
  };
}

export function createQuizAttemptsRouteHandlers(deps: QuizAttemptsRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, quizId } = await context.params;
      const quiz = await deps.getQuizById(workspaceId, quizId);
      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      const attempts = await deps.listQuizAttempts(workspaceId, quizId);
      return NextResponse.json({ data: attempts.map(toAttemptPayload) });
    },
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, quizId } = await context.params;
      const quiz = await deps.getQuizById(workspaceId, quizId);
      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as {
        answers?: QuizAnswerInput[];
      } | null;
      const answers = rawBody?.answers ?? [];
      if (!Array.isArray(answers) || answers.length === 0) {
        return NextResponse.json({ error: 'Quiz answers are required' }, { status: 400 });
      }

      const attempt = await deps.createQuizAttempt(workspaceId, quizId, answers);
      if (!attempt) {
        return NextResponse.json({ error: 'Failed to create quiz attempt' }, { status: 500 });
      }

      return NextResponse.json({ data: toAttemptPayload(attempt) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createQuizAttemptsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getQuizById,
  listQuizAttempts,
  createQuizAttempt,
});
