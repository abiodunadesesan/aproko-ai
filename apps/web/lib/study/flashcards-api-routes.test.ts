import assert from 'node:assert/strict';
import test from 'node:test';
import { createFlashcardDecksRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/flashcards/decks/route';
import { createFlashcardDeckByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/route';
import { createFlashcardCardsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/cards/route';
import { createFlashcardGenerateRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/generate/route';

test('flashcard decks GET returns 401 when unauthenticated', async () => {
  const handlers = createFlashcardDecksRouteHandlers({
    auth: async () => ({ userId: null }),
    listFlashcardDecks: async () => [],
    createFlashcardDeck: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('flashcard decks POST creates deck', async () => {
  const handlers = createFlashcardDecksRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listFlashcardDecks: async () => [],
    createFlashcardDeck: async () => ({
      id: 'deck-1',
      workspaceId: 'ws-1',
      title: 'Biology Deck',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Biology Deck', sourceNoteId: 'note-1' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; title: string } };
  assert.equal(payload.data.id, 'deck-1');
  assert.equal(payload.data.title, 'Biology Deck');
});

test('flashcard cards POST validates deck existence', async () => {
  const handlers = createFlashcardCardsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getFlashcardDeckById: async () => null,
    listFlashcardsByDeck: async () => [],
    createFlashcard: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Q?', answer: 'A.' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', deckId: 'missing' }) },
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Deck not found' });
});

test('flashcard cards POST creates card', async () => {
  const handlers = createFlashcardCardsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getFlashcardDeckById: async () => ({
      id: 'deck-1',
      workspaceId: 'ws-1',
      title: 'Biology Deck',
      sourceNoteId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listFlashcardsByDeck: async () => [],
    createFlashcard: async () => ({
      id: 'card-1',
      workspaceId: 'ws-1',
      deckId: 'deck-1',
      question: 'What is osmosis?',
      answer: 'Movement of water across semipermeable membrane',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'What is osmosis?',
        answer: 'Movement of water across semipermeable membrane',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', deckId: 'deck-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; question: string } };
  assert.equal(payload.data.id, 'card-1');
  assert.equal(payload.data.question, 'What is osmosis?');
});

test('flashcard generate POST creates cards from note', async () => {
  const handlers = createFlashcardGenerateRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getFlashcardDeckById: async () => ({
      id: 'deck-1',
      workspaceId: 'ws-1',
      title: 'Biology Deck',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    getWorkspaceNoteById: async () => ({
      id: 'note-1',
      workspaceId: 'ws-1',
      title: 'Cell Biology',
      content:
        'The cell membrane controls what enters and leaves the cell. Mitochondria produce ATP for energy.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    createFlashcard: async (_workspaceId, deckId, question, answer) => ({
      id: `${deckId}-${question.slice(0, 4)}`,
      workspaceId: 'ws-1',
      deckId,
      question,
      answer,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', deckId: 'deck-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: Array<{ id: string }> };
  assert.ok(payload.data.length > 0);
});

test('flashcard deck by id DELETE returns ok', async () => {
  const handlers = createFlashcardDeckByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getFlashcardDeckById: async () => null,
    updateFlashcardDeck: async () => null,
    deleteFlashcardDeck: async () => true,
  });

  const response = await handlers.DELETE(new Request('http://localhost', { method: 'DELETE' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', deckId: 'deck-1' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
