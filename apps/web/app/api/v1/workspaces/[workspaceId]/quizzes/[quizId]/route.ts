import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getQuizById,
  listQuizQuestions,
  type Quiz,
  type QuizQuestion,
} from '@/lib/storage/quizzes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizByIdRouteDependencies = {
  auth: AuthDependency;
  getQuizById: typeof getQuizById;
  listQuizQuestions: typeof listQuizQuestions;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; quizId: string }>;
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

function toQuestionPayload(question: QuizQuestion) {
  return {
    id: question.id,
    workspaceId: question.workspaceId,
    quizId: question.quizId,
    prompt: question.prompt,
    options: question.options,
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

export function createQuizByIdRouteHandlers(deps: QuizByIdRouteDependencies) {
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

      const questions = await deps.listQuizQuestions(workspaceId, quizId);
      return NextResponse.json({
        data: {
          quiz: toQuizPayload(quiz),
          questions: questions.map(toQuestionPayload),
        },
      });
    },
  };
}

export const { GET } = createQuizByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getQuizById,
  listQuizQuestions,
});
