import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createQuizAttempt,
  getQuizById,
  type QuizAnswerInput,
  type QuizAttempt,
} from '@/lib/storage/quizzes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizAttemptSubmitRouteDependencies = {
  auth: AuthDependency;
  getQuizById: typeof getQuizById;
  createQuizAttempt: typeof createQuizAttempt;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; quizId: string; attemptId: string }>;
};

function toAttemptPayload(attempt: QuizAttempt, clientAttemptId: string) {
  return {
    id: attempt.id,
    clientAttemptId,
    workspaceId: attempt.workspaceId,
    quizId: attempt.quizId,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    createdAt: attempt.createdAt,
  };
}

export function createQuizAttemptSubmitRouteHandlers(deps: QuizAttemptSubmitRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, quizId, attemptId } = await context.params;
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
        return NextResponse.json({ error: 'Failed to submit quiz attempt' }, { status: 500 });
      }

      return NextResponse.json({ data: toAttemptPayload(attempt, attemptId) });
    },
  };
}

export const { POST } = createQuizAttemptSubmitRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getQuizById,
  createQuizAttempt,
});
