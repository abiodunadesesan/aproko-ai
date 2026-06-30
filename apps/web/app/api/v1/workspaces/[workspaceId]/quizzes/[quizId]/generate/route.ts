import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createQuizQuestion, getQuizById, type QuizQuestion } from '@/lib/storage/quizzes';
import { getWorkspaceNoteById } from '@/lib/storage/notes';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizGenerateRouteDependencies = {
  auth: AuthDependency;
  getQuizById: typeof getQuizById;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  createQuizQuestion: typeof createQuizQuestion;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; quizId: string }>;
};

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

function buildQuestionDrafts(
  noteContent: string,
): Array<{ prompt: string; options: string[]; correctOptionIndex: number }> {
  const sentences = noteContent
    .split(/[.\n]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 18)
    .slice(0, 5);

  return sentences.map((sentence, index) => ({
    prompt: `Q${index + 1}. Which option best matches this note point?`,
    options: [
      sentence,
      'This statement is unrelated to the note',
      'No relevant point was captured',
      'The note did not mention this topic',
    ],
    correctOptionIndex: 0,
  }));
}

export function createQuizGenerateRouteHandlers(deps: QuizGenerateRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.quizzesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, quizId } = await context.params;
      const quiz = await deps.getQuizById(workspaceId, quizId);
      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as { noteId?: string } | null;
      const noteId = rawBody?.noteId?.trim() || quiz.sourceNoteId || '';
      if (!noteId) {
        return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
      }

      const note = await deps.getWorkspaceNoteById(workspaceId, noteId);
      if (!note) {
        return NextResponse.json({ error: 'Source note not found' }, { status: 404 });
      }

      const drafts = buildQuestionDrafts(note.content);
      if (!drafts.length) {
        return NextResponse.json(
          { error: 'Note content is too short for quiz generation' },
          { status: 400 },
        );
      }

      const created: QuizQuestion[] = [];
      for (const draft of drafts) {
        const question = await deps.createQuizQuestion(
          workspaceId,
          quizId,
          draft.prompt,
          draft.options,
          draft.correctOptionIndex,
        );
        if (question) {
          created.push(question);
        }
      }

      return NextResponse.json({ data: created.map(toQuestionPayload) });
    },
  };
}

export const { POST } = createQuizGenerateRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getQuizById,
  getWorkspaceNoteById,
  createQuizQuestion,
});
