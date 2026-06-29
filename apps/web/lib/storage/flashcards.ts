import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type FlashcardDeck = {
  id: string;
  workspaceId: string;
  title: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Flashcard = {
  id: string;
  workspaceId: string;
  deckId: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

type DbDeckRow = {
  id: string;
  workspace_id: string;
  title: string;
  source_note_id: string | null;
  created_at: string;
  updated_at: string;
};

type DbFlashcardRow = {
  id: string;
  workspace_id: string;
  deck_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

function toDeck(row: DbDeckRow): FlashcardDeck {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    sourceNoteId: row.source_note_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFlashcard(row: DbFlashcardRow): Flashcard {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    deckId: row.deck_id,
    question: row.question,
    answer: row.answer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTitle(rawTitle: string): string {
  const title = rawTitle.trim();
  return title || 'Untitled deck';
}

export async function listFlashcardDecks(workspaceId: string): Promise<FlashcardDeck[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Unable to list flashcard decks.', error.message);
    return [];
  }

  return ((data ?? []) as DbDeckRow[]).map(toDeck);
}

export async function createFlashcardDeck(
  workspaceId: string,
  titleRaw: string,
  sourceNoteId?: string | null,
): Promise<FlashcardDeck | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const title = normalizeTitle(titleRaw);

  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({
      workspace_id: workspaceId,
      title,
      source_note_id: sourceNoteId ?? null,
    })
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create flashcard deck.', error?.message ?? 'unknown_error');
    return null;
  }

  return toDeck(data as DbDeckRow);
}

export async function getFlashcardDeckById(
  workspaceId: string,
  deckId: string,
): Promise<FlashcardDeck | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', deckId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toDeck(data as DbDeckRow);
}

export async function updateFlashcardDeck(
  workspaceId: string,
  deckId: string,
  titleRaw: string,
): Promise<FlashcardDeck | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const title = normalizeTitle(titleRaw);

  const { data, error } = await supabase
    .from('flashcard_decks')
    .update({ title })
    .eq('workspace_id', workspaceId)
    .eq('id', deckId)
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toDeck(data as DbDeckRow);
}

export async function deleteFlashcardDeck(workspaceId: string, deckId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('flashcard_decks')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', deckId);
  if (error) {
    console.warn('Unable to delete flashcard deck.', error.message);
    return false;
  }

  return true;
}

export async function listFlashcardsByDeck(
  workspaceId: string,
  deckId: string,
): Promise<Flashcard[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('flashcards')
    .select('id, workspace_id, deck_id, question, answer, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    console.warn('Unable to list flashcards by deck.', error.message);
    return [];
  }

  return ((data ?? []) as DbFlashcardRow[]).map(toFlashcard);
}

export async function createFlashcard(
  workspaceId: string,
  deckId: string,
  questionRaw: string,
  answerRaw: string,
): Promise<Flashcard | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const question = questionRaw.trim();
  const answer = answerRaw.trim();
  if (!question || !answer) {
    return null;
  }

  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      workspace_id: workspaceId,
      deck_id: deckId,
      question,
      answer,
    })
    .select('id, workspace_id, deck_id, question, answer, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create flashcard.', error?.message ?? 'unknown_error');
    return null;
  }

  return toFlashcard(data as DbFlashcardRow);
}

export async function updateFlashcard(
  workspaceId: string,
  deckId: string,
  flashcardId: string,
  questionRaw: string,
  answerRaw: string,
): Promise<Flashcard | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const question = questionRaw.trim();
  const answer = answerRaw.trim();
  if (!question || !answer) {
    return null;
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update({
      question,
      answer,
    })
    .eq('workspace_id', workspaceId)
    .eq('deck_id', deckId)
    .eq('id', flashcardId)
    .select('id, workspace_id, deck_id, question, answer, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toFlashcard(data as DbFlashcardRow);
}

export async function deleteFlashcard(
  workspaceId: string,
  deckId: string,
  flashcardId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('deck_id', deckId)
    .eq('id', flashcardId);

  if (error) {
    console.warn('Unable to delete flashcard.', error.message);
    return false;
  }

  return true;
}
