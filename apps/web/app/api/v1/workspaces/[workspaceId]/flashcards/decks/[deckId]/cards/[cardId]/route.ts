import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteFlashcard,
  getFlashcardDeckById,
  updateFlashcard,
  type Flashcard,
} from '@/lib/storage/flashcards';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardByIdRouteDependencies = {
  auth: AuthDependency;
  getFlashcardDeckById: typeof getFlashcardDeckById;
  updateFlashcard: typeof updateFlashcard;
  deleteFlashcard: typeof deleteFlashcard;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; deckId: string; cardId: string }>;
};

function toCardPayload(card: Flashcard) {
  return {
    id: card.id,
    workspaceId: card.workspaceId,
    deckId: card.deckId,
    question: card.question,
    answer: card.answer,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export function createFlashcardByIdRouteHandlers(deps: FlashcardByIdRouteDependencies) {
  return {
    PATCH: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.flashcardsWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, deckId, cardId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const deck = await deps.getFlashcardDeckById(workspaceId, deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as {
        question?: string;
        answer?: string;
      } | null;
      const question = rawBody?.question?.trim() ?? '';
      const answer = rawBody?.answer?.trim() ?? '';
      if (!question || !answer) {
        return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
      }

      const updated = await deps.updateFlashcard(workspaceId, deckId, cardId, question, answer);
      if (!updated) {
        return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
      }

      return NextResponse.json({ data: toCardPayload(updated) });
    },

    DELETE: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.flashcardsWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, deckId, cardId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const deck = await deps.getFlashcardDeckById(workspaceId, deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      const deleted = await deps.deleteFlashcard(workspaceId, deckId, cardId);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Flashcard not found or delete failed' },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true });
    },
  };
}

export const { PATCH, DELETE } = createFlashcardByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getFlashcardDeckById,
  updateFlashcard,
  deleteFlashcard,
});
