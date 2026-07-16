import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createFlashcardDeck,
  listFlashcardDecks,
  type FlashcardDeck,
} from '@/lib/storage/flashcards';
import { withPerformanceHeaders } from '@/lib/perf/http';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FlashcardDecksRouteDependencies = {
  auth: AuthDependency;
  listFlashcardDecks: typeof listFlashcardDecks;
  createFlashcardDeck: typeof createFlashcardDeck;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
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

export function createFlashcardDecksRouteHandlers(deps: FlashcardDecksRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const startedAtMs = Date.now();
      const { userId } = await deps.auth();
      if (!userId) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const decks = await deps.listFlashcardDecks(workspaceId);
      return withPerformanceHeaders(
        NextResponse.json({ data: decks.map(toDeckPayload) }),
        startedAtMs,
        {
          cacheControl: 'private, max-age=20, stale-while-revalidate=90',
        },
      );
    },

    POST: async (request: Request, context: RouteContext) => {
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

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        sourceNoteId?: string | null;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      if (!title) {
        return NextResponse.json({ error: 'Deck title is required' }, { status: 400 });
      }

      const deck = await deps.createFlashcardDeck(
        workspaceId,
        title,
        rawBody?.sourceNoteId ?? null,
      );
      if (!deck) {
        return NextResponse.json({ error: 'Failed to create flashcard deck' }, { status: 500 });
      }

      return NextResponse.json({ data: toDeckPayload(deck) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createFlashcardDecksRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listFlashcardDecks,
  createFlashcardDeck,
});
