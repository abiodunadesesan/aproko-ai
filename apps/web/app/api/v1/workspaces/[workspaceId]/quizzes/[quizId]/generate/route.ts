import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateQuizQuestionDrafts } from '@/lib/ai/study-generation';
import { createQuizQuestion, getQuizById, type QuizQuestion } from '@/lib/storage/quizzes';
import { getWorkspaceNoteById, listWorkspaceNotes } from '@/lib/storage/notes';
import { readLibrarySourceText } from '@/lib/storage/library';
import { resolveStudySourceContent } from '@/lib/study/resolve-source';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type QuizGenerateRouteDependencies = {
  auth: AuthDependency;
  getQuizById: typeof getQuizById;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  readLibrarySourceText: typeof readLibrarySourceText;
  createQuizQuestion: typeof createQuizQuestion;
  generateQuizQuestionDrafts: typeof generateQuizQuestionDrafts;
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

export function createQuizGenerateRouteHandlers(deps: QuizGenerateRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.quizzesWrite,
        });
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        const { workspaceId, quizId } = await context.params;
        const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
        if (forbidden) {
          return forbidden;
        }
        const quiz = await deps.getQuizById(workspaceId, quizId);
        if (!quiz) {
          return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        const rawBody = (await request.json().catch(() => null)) as {
          noteId?: string;
          sourceId?: string;
        } | null;

        let resolved;
        try {
          resolved = await resolveStudySourceContent(
            workspaceId,
            {
              noteId: rawBody?.noteId || quiz.sourceNoteId || null,
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
          return NextResponse.json(
            { error: message },
            { status: message.includes('not found') ? 404 : 400 },
          );
        }

        const drafts = await deps.generateQuizQuestionDrafts(resolved.content);
        if (!drafts.length) {
          return NextResponse.json(
            { error: 'Source content is too short for quiz generation' },
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

        await trackServerEvent({
          event: 'quiz_generated',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            quiz_id: quizId,
            note_id: resolved.sourceNoteId,
            source_id: resolved.sourceId,
            questions_generated: created.length,
          },
        });

        return NextResponse.json({ data: created.map(toQuestionPayload) });
      } catch (error) {
        console.error('Failed to generate quiz', error);
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to generate quiz',
          },
          { status: 500 },
        );
      }
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
  listWorkspaceNotes,
  readLibrarySourceText,
  createQuizQuestion,
  generateQuizQuestionDrafts,
});
