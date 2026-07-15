import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateFlashcardDrafts } from '@/lib/ai/study-generation';
import { createFlashcard, getFlashcardDeckById, type Flashcard } from '@/lib/storage/flashcards';
import { getWorkspaceNoteById, listWorkspaceNotes } from '@/lib/storage/notes';
import { readLibrarySourceText } from '@/lib/storage/library';
import { resolveStudySourceContent } from '@/lib/study/resolve-source';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardGenerateRouteDependencies = {
  auth: AuthDependency;
  getFlashcardDeckById: typeof getFlashcardDeckById;
  getWorkspaceNoteById: typeof getWorkspaceNoteById;
  listWorkspaceNotes: typeof listWorkspaceNotes;
  readLibrarySourceText: typeof readLibrarySourceText;
  createFlashcard: typeof createFlashcard;
  generateFlashcardDrafts: typeof generateFlashcardDrafts;
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

export function createFlashcardGenerateRouteHandlers(deps: FlashcardGenerateRouteDependencies) {
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
          policy: rateLimitPolicies.flashcardsGenerate,
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
          noteId?: string;
          sourceId?: string;
        } | null;

        let resolved;
        try {
          resolved = await resolveStudySourceContent(
            workspaceId,
            {
              noteId: rawBody?.noteId || deck.sourceNoteId,
              sourceId: rawBody?.sourceId,
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

        const pairs = await deps.generateFlashcardDrafts(resolved.content);
        if (!pairs.length) {
          return NextResponse.json(
            { error: 'Source content is too short for generation' },
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

        await trackServerEvent({
          event: 'flashcards_generated',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            deck_id: deckId,
            note_id: resolved.sourceNoteId,
            source_id: resolved.sourceId,
            cards_generated: created.length,
          },
        });

        return NextResponse.json({
          data: created.map(toCardPayload),
        });
      } catch (error) {
        console.error('Failed to generate flashcards', error);
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to generate flashcards',
          },
          { status: 500 },
        );
      }
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
  listWorkspaceNotes,
  readLibrarySourceText,
  createFlashcard,
  generateFlashcardDrafts,
});
