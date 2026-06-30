import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createFlashcard,
  getFlashcardDeckById,
  listFlashcardsByDeck,
  type Flashcard,
} from '@/lib/storage/flashcards';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardCardsRouteDependencies = {
  auth: AuthDependency;
  getFlashcardDeckById: typeof getFlashcardDeckById;
  listFlashcardsByDeck: typeof listFlashcardsByDeck;
  createFlashcard: typeof createFlashcard;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; deckId: string }>;
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

export function createFlashcardCardsRouteHandlers(deps: FlashcardCardsRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, deckId } = await context.params;
      const deck = await deps.getFlashcardDeckById(workspaceId, deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      const cards = await deps.listFlashcardsByDeck(workspaceId, deckId);
      return NextResponse.json({ data: cards.map(toCardPayload) });
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.flashcardsWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, deckId } = await context.params;
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

      const card = await deps.createFlashcard(workspaceId, deckId, question, answer);
      if (!card) {
        return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 });
      }

      return NextResponse.json({ data: toCardPayload(card) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createFlashcardCardsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getFlashcardDeckById,
  listFlashcardsByDeck,
  createFlashcard,
});
