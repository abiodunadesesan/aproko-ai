import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createFlashcard, getFlashcardDeckById, type Flashcard } from '@/lib/storage/flashcards';
import { getWorkspaceNoteById } from '@/lib/storage/notes';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardGenerateRouteDependencies = {
  auth: AuthDependency;
  getFlashcardDeckById: typeof getFlashcardDeckById;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
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

function buildFlashcardPairs(noteContent: string): Array<{ question: string; answer: string }> {
  const segments = noteContent
    .split(/[.\n]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 20)
    .slice(0, 6);

  return segments.map((segment, index) => ({
    question: `Flashcard ${index + 1}: What is a key point from this note?`,
    answer: segment,
  }));
}

export function createFlashcardGenerateRouteHandlers(deps: FlashcardGenerateRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, deckId } = await context.params;
      const deck = await deps.getFlashcardDeckById(workspaceId, deckId);
      if (!deck) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as { noteId?: string } | null;
      const noteId = rawBody?.noteId?.trim() || deck.sourceNoteId || '';
      if (!noteId) {
        return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
      }

      const note = await deps.getWorkspaceNoteById(workspaceId, noteId);
      if (!note) {
        return NextResponse.json({ error: 'Source note not found' }, { status: 404 });
      }

      const pairs = buildFlashcardPairs(note.content);
      if (!pairs.length) {
        return NextResponse.json(
          { error: 'Note content is too short for generation' },
          { status: 400 },
        );
      }

      const created: Flashcard[] = [];
      for (const pair of pairs) {
        const card = await deps.createFlashcard(workspaceId, deckId, pair.question, pair.answer);
        if (card) {
          created.push(card);
        }
      }

      return NextResponse.json({
        data: created.map(toCardPayload),
      });
    },
  };
}

export const { POST } = createFlashcardGenerateRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getFlashcardDeckById,
  getWorkspaceNoteById,
  createFlashcard,
});
