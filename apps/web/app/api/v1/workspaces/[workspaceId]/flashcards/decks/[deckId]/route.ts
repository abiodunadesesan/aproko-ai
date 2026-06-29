import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteFlashcardDeck,
  getFlashcardDeckById,
  updateFlashcardDeck,
  type FlashcardDeck,
} from '@/lib/storage/flashcards';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardDeckByIdRouteDependencies = {
  auth: AuthDependency;
  getFlashcardDeckById: typeof getFlashcardDeckById;
  updateFlashcardDeck: typeof updateFlashcardDeck;
  deleteFlashcardDeck: typeof deleteFlashcardDeck;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; deckId: string }>;
};

function toDeckPayload(deck: FlashcardDeck) {
  return {
    id: deck.id,
    workspaceId: deck.workspaceId,
    title: deck.title,
    sourceNoteId: deck.sourceNoteId,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}

export function createFlashcardDeckByIdRouteHandlers(deps: FlashcardDeckByIdRouteDependencies) {
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

      return NextResponse.json({ data: toDeckPayload(deck) });
    },

    PATCH: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, deckId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as { title?: string } | null;
      const title = rawBody?.title?.trim() ?? '';
      if (!title) {
        return NextResponse.json({ error: 'Deck title is required' }, { status: 400 });
      }

      const updated = await deps.updateFlashcardDeck(workspaceId, deckId, title);
      if (!updated) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      return NextResponse.json({ data: toDeckPayload(updated) });
    },

    DELETE: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, deckId } = await context.params;
      const deleted = await deps.deleteFlashcardDeck(workspaceId, deckId);
      if (!deleted) {
        return NextResponse.json({ error: 'Deck not found or delete failed' }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    },
  };
}

export const { GET, PATCH, DELETE } = createFlashcardDeckByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getFlashcardDeckById,
  updateFlashcardDeck,
  deleteFlashcardDeck,
});
