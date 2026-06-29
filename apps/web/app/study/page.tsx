'use client';

import { useEffect, useMemo, useState } from 'react';
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

const WORKSPACE_ID = 'default-workspace';

type Note = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type NotesResponse = {
  data?: Note[];
  error?: string;
};

type FlashcardDeck = {
  id: string;
  workspaceId: string;
  title: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Flashcard = {
  id: string;
  workspaceId: string;
  deckId: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

type FlashcardDecksResponse = {
  data?: FlashcardDeck[];
  error?: string;
};

type FlashcardsResponse = {
  data?: Flashcard[];
  error?: string;
};

export default function StudyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [contentDraft, setContentDraft] = useState('');
  const [deckTitleDraft, setDeckTitleDraft] = useState('New deck');
  const [cardQuestionDraft, setCardQuestionDraft] = useState('');
  const [cardAnswerDraft, setCardAnswerDraft] = useState('');
  const [query, setQuery] = useState('');
  const [deckQuery, setDeckQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [activeNoteId, notes],
  );
  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [activeDeckId, decks],
  );

  const filteredNotes = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return notes;
    }

    return notes.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(normalized),
    );
  }, [notes, query]);

  const filteredDecks = useMemo(() => {
    const normalized = deckQuery.toLowerCase().trim();
    if (!normalized) {
      return decks;
    }

    return decks.filter((deck) => deck.title.toLowerCase().includes(normalized));
  }, [deckQuery, decks]);

  async function loadNotes() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/notes`);
      const payload = (await response.json()) as NotesResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load notes');
      }

      setNotes(payload.data);
      setActiveNoteId((currentId) => {
        if (currentId && payload.data?.some((note) => note.id === currentId)) {
          return currentId;
        }
        return payload.data?.[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load notes');
      setNotes([]);
      setActiveNoteId(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDecks() {
    setIsLoadingDecks(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks`);
      const payload = (await response.json()) as FlashcardDecksResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load flashcard decks');
      }

      setDecks(payload.data);
      setActiveDeckId((currentId) => {
        if (currentId && payload.data?.some((deck) => deck.id === currentId)) {
          return currentId;
        }
        return payload.data?.[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load flashcard decks');
      setDecks([]);
      setActiveDeckId(null);
    } finally {
      setIsLoadingDecks(false);
    }
  }

  async function loadDeckCards(deckId: string) {
    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks/${deckId}/cards`,
      );
      const payload = (await response.json()) as FlashcardsResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load flashcards');
      }

      setCards(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load flashcards');
      setCards([]);
    }
  }

  async function createNote() {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/notes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'New note', content: '' }),
      });
      const payload = (await response.json()) as { data?: Note; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create note');
      }

      setNotes((current) => [payload.data as Note, ...current]);
      setActiveNoteId(payload.data.id);
      setNotice('Note created.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create note');
    } finally {
      setIsSaving(false);
    }
  }

  async function createDeck() {
    if (!deckTitleDraft.trim()) {
      setError('Deck title is required.');
      return;
    }

    setIsSavingDeck(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: deckTitleDraft,
          sourceNoteId: activeNoteId,
        }),
      });

      const payload = (await response.json()) as { data?: FlashcardDeck; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create flashcard deck');
      }

      setDecks((current) => [payload.data as FlashcardDeck, ...current]);
      setActiveDeckId(payload.data.id);
      setDeckTitleDraft('New deck');
      setNotice('Flashcard deck created.');
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : 'Failed to create flashcard deck',
      );
    } finally {
      setIsSavingDeck(false);
    }
  }

  async function addCardToDeck() {
    if (!activeDeck) {
      setError('Select a deck before adding flashcards.');
      return;
    }

    if (!cardQuestionDraft.trim() || !cardAnswerDraft.trim()) {
      setError('Question and answer are required.');
      return;
    }

    setIsSavingCard(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks/${activeDeck.id}/cards`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            question: cardQuestionDraft,
            answer: cardAnswerDraft,
          }),
        },
      );
      const payload = (await response.json()) as { data?: Flashcard; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create flashcard');
      }

      setCards((current) => [...current, payload.data as Flashcard]);
      setCardQuestionDraft('');
      setCardAnswerDraft('');
      setNotice('Flashcard added.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create flashcard');
    } finally {
      setIsSavingCard(false);
    }
  }

  async function generateCardsFromNote() {
    if (!activeDeck) {
      setError('Select a deck before generating flashcards.');
      return;
    }

    if (!activeNote) {
      setError('Select a source note for generation.');
      return;
    }

    setIsGeneratingCards(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks/${activeDeck.id}/generate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ noteId: activeNote.id }),
        },
      );
      const payload = (await response.json()) as { data?: Flashcard[]; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to generate flashcards');
      }

      await loadDeckCards(activeDeck.id);
      setNotice(
        `Generated ${payload.data.length} flashcard${payload.data.length === 1 ? '' : 's'}.`,
      );
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : 'Failed to generate flashcards',
      );
    } finally {
      setIsGeneratingCards(false);
    }
  }

  async function deleteDeck() {
    if (!activeDeck) {
      return;
    }

    setIsDeletingDeck(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/flashcards/decks/${activeDeck.id}`,
        {
          method: 'DELETE',
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete flashcard deck');
      }

      setDecks((current) => current.filter((deck) => deck.id !== activeDeck.id));
      setActiveDeckId((current) => {
        if (current !== activeDeck.id) {
          return current;
        }

        const remaining = decks.filter((deck) => deck.id !== activeDeck.id);
        return remaining[0]?.id ?? null;
      });
      setCards([]);
      setNotice('Deck deleted.');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete flashcard deck',
      );
    } finally {
      setIsDeletingDeck(false);
    }
  }

  async function saveActiveNote() {
    if (!activeNote) {
      setError('Select a note to save.');
      return;
    }

    if (!titleDraft.trim() && !contentDraft.trim()) {
      setError('Title or content is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/notes/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: titleDraft,
          content: contentDraft,
        }),
      });
      const payload = (await response.json()) as { data?: Note; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to save note');
      }

      const updated = payload.data;
      setNotes((current) => current.map((note) => (note.id === updated.id ? updated : note)));
      setNotice('Note saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteActiveNote() {
    if (!activeNote) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/notes/${activeNote.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete note');
      }

      setNotes((current) => current.filter((note) => note.id !== activeNote.id));
      setActiveNoteId((current) => {
        if (current !== activeNote.id) {
          return current;
        }

        const remaining = notes.filter((note) => note.id !== activeNote.id);
        return remaining[0]?.id ?? null;
      });
      setNotice('Note deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    void loadNotes();
    void loadDecks();
  }, []);

  useEffect(() => {
    if (!activeNote) {
      setTitleDraft('');
      setContentDraft('');
      return;
    }

    setTitleDraft(activeNote.title);
    setContentDraft(activeNote.content);
  }, [activeNote]);

  useEffect(() => {
    if (!activeDeckId) {
      setCards([]);
      return;
    }

    void loadDeckCards(activeDeckId);
  }, [activeDeckId]);

  return (
    <AppShell
      subtitle="Study workspace baseline with notes and flashcards management before quiz and AI summary features."
      title="Study"
    >
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className={`${cardClass} space-y-3`}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Notes</p>
            <p className="text-xs text-muted-foreground">NOTE-001 baseline</p>
          </div>

          <input
            className={inputClass}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes..."
            value={query}
          />

          <button
            className={buttonPrimaryClass}
            disabled={isSaving}
            onClick={() => void createNote()}
            type="button"
          >
            {isSaving ? 'Working...' : 'New Note'}
          </button>

          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes found.</p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  className={`w-full rounded-md border px-3 py-2 text-left ${
                    activeNoteId === note.id ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  type="button"
                >
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {note.content || 'Empty note'}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <div className={`${cardClass} space-y-3`}>
            {!activeNote ? (
              <p className="text-sm text-muted-foreground">
                Select a note or create one to start writing.
              </p>
            ) : (
              <>
                <input
                  className={inputClass}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  placeholder="Note title"
                  value={titleDraft}
                />
                <textarea
                  className="min-h-[240px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setContentDraft(event.target.value)}
                  placeholder="Write your note..."
                  value={contentDraft}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={isSaving || isDeleting}
                    onClick={() => void saveActiveNote()}
                    type="button"
                  >
                    {isSaving ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isSaving || isDeleting}
                    onClick={() => void deleteActiveNote()}
                    type="button"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Note'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={`${cardClass} space-y-3`}>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Flashcards</p>
              <p className="text-xs text-muted-foreground">FLASH-001 baseline</p>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className={inputClass}
                onChange={(event) => setDeckTitleDraft(event.target.value)}
                placeholder="Deck title"
                value={deckTitleDraft}
              />
              <button
                className={buttonPrimaryClass}
                disabled={isSavingDeck}
                onClick={() => void createDeck()}
                type="button"
              >
                {isSavingDeck ? 'Creating...' : 'New Deck'}
              </button>
            </div>

            <input
              className={inputClass}
              onChange={(event) => setDeckQuery(event.target.value)}
              placeholder="Search decks..."
              value={deckQuery}
            />

            {isLoadingDecks ? (
              <p className="text-sm text-muted-foreground">Loading decks...</p>
            ) : filteredDecks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flashcard decks yet.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {filteredDecks.map((deck) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-left ${
                      activeDeckId === deck.id ? 'bg-muted' : 'hover:bg-muted'
                    }`}
                    key={deck.id}
                    onClick={() => setActiveDeckId(deck.id)}
                    type="button"
                  >
                    <p className="text-sm font-medium">{deck.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deck.sourceNoteId ? `Note: ${deck.sourceNoteId}` : 'No note link'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {activeDeck ? (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Deck: {activeDeck.title}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={isGeneratingCards || !activeNote}
                    onClick={() => void generateCardsFromNote()}
                    type="button"
                  >
                    {isGeneratingCards ? 'Generating...' : 'Generate from Active Note'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isDeletingDeck}
                    onClick={() => void deleteDeck()}
                    type="button"
                  >
                    {isDeletingDeck ? 'Deleting...' : 'Delete Deck'}
                  </button>
                </div>

                <div className="grid gap-2">
                  <input
                    className={inputClass}
                    onChange={(event) => setCardQuestionDraft(event.target.value)}
                    placeholder="Question"
                    value={cardQuestionDraft}
                  />
                  <textarea
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setCardAnswerDraft(event.target.value)}
                    placeholder="Answer"
                    value={cardAnswerDraft}
                  />
                  <button
                    className={buttonSecondaryClass}
                    disabled={isSavingCard}
                    onClick={() => void addCardToDeck()}
                    type="button"
                  >
                    {isSavingCard ? 'Adding...' : 'Add Card'}
                  </button>
                </div>

                {cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No flashcards in this deck yet.</p>
                ) : (
                  <div className="space-y-2">
                    {cards.map((card) => (
                      <article className="rounded-md border px-3 py-2" key={card.id}>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Q</p>
                        <p className="text-sm">{card.question}</p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                          A
                        </p>
                        <p className="text-sm">{card.answer}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
