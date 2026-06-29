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

type Quiz = {
  id: string;
  workspaceId: string;
  title: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

type QuizQuestion = {
  id: string;
  workspaceId: string;
  quizId: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
};

type QuizAttempt = {
  id: string;
  workspaceId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

type StudySummary = {
  id: string;
  workspaceId: string;
  summaryType: 'study';
  title: string;
  content: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function StudyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [summaryQuery, setSummaryQuery] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [contentDraft, setContentDraft] = useState('');
  const [deckTitleDraft, setDeckTitleDraft] = useState('New deck');
  const [cardQuestionDraft, setCardQuestionDraft] = useState('');
  const [cardAnswerDraft, setCardAnswerDraft] = useState('');
  const [quizTitleDraft, setQuizTitleDraft] = useState('New quiz');
  const [query, setQuery] = useState('');
  const [deckQuery, setDeckQuery] = useState('');
  const [quizQuery, setQuizQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [quizAnswerDrafts, setQuizAnswerDrafts] = useState<Record<string, number>>({});
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
  const activeQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === activeQuizId) ?? null,
    [activeQuizId, quizzes],
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

  const filteredQuizzes = useMemo(() => {
    const normalized = quizQuery.toLowerCase().trim();
    if (!normalized) {
      return quizzes;
    }

    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(normalized));
  }, [quizQuery, quizzes]);

  const filteredSummaries = useMemo(() => {
    const normalized = summaryQuery.toLowerCase().trim();
    if (!normalized) {
      return summaries;
    }

    return summaries.filter((summary) =>
      `${summary.title} ${summary.content}`.toLowerCase().includes(normalized),
    );
  }, [summaryQuery, summaries]);

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

  async function loadQuizzes() {
    setIsLoadingQuizzes(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/quizzes`);
      const payload = (await response.json()) as { data?: Quiz[]; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load quizzes');
      }

      setQuizzes(payload.data);
      setActiveQuizId((currentId) => {
        if (currentId && payload.data?.some((quiz) => quiz.id === currentId)) {
          return currentId;
        }
        return payload.data?.[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load quizzes');
      setQuizzes([]);
      setActiveQuizId(null);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }

  async function loadQuizDetails(quizId: string) {
    try {
      const [detailResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/v1/workspaces/${WORKSPACE_ID}/quizzes/${quizId}`),
        fetch(`/api/v1/workspaces/${WORKSPACE_ID}/quizzes/${quizId}/attempts`),
      ]);

      const [detailPayload, attemptsPayload] = (await Promise.all([
        detailResponse.json(),
        attemptsResponse.json(),
      ])) as [
        { data?: { quiz: Quiz; questions: QuizQuestion[] }; error?: string },
        { data?: QuizAttempt[]; error?: string },
      ];

      if (!detailResponse.ok || !detailPayload.data) {
        throw new Error(detailPayload.error ?? 'Failed to load quiz details');
      }
      if (!attemptsResponse.ok || !attemptsPayload.data) {
        throw new Error(attemptsPayload.error ?? 'Failed to load quiz attempts');
      }

      setQuizQuestions(detailPayload.data.questions);
      setQuizAnswerDrafts({});
      setQuizAttempts(attemptsPayload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load quiz details');
      setQuizQuestions([]);
      setQuizAttempts([]);
      setQuizAnswerDrafts({});
    }
  }

  async function loadSummaries() {
    setIsLoadingSummaries(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/summaries`);
      const payload = (await response.json()) as { data?: StudySummary[]; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load study summaries');
      }

      setSummaries(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load study summaries');
      setSummaries([]);
    } finally {
      setIsLoadingSummaries(false);
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

      setCards((current) => mergeUniqueById(current, payload.data as Flashcard[]));
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

  async function createQuiz() {
    if (!quizTitleDraft.trim()) {
      setError('Quiz title is required.');
      return;
    }

    setIsSavingQuiz(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/quizzes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: quizTitleDraft,
          sourceNoteId: activeNoteId,
        }),
      });

      const payload = (await response.json()) as { data?: Quiz; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create quiz');
      }

      setQuizzes((current) => [payload.data as Quiz, ...current]);
      setActiveQuizId(payload.data.id);
      setQuizTitleDraft('New quiz');
      setNotice('Quiz created.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create quiz');
    } finally {
      setIsSavingQuiz(false);
    }
  }

  async function generateQuizFromNote() {
    if (!activeQuiz) {
      setError('Select a quiz before generating questions.');
      return;
    }
    if (!activeNote) {
      setError('Select an active note for quiz generation.');
      return;
    }

    setIsGeneratingQuiz(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/quizzes/${activeQuiz.id}/generate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ noteId: activeNote.id }),
        },
      );
      const payload = (await response.json()) as { data?: QuizQuestion[]; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to generate quiz questions');
      }

      setQuizQuestions((current) => mergeUniqueById(current, payload.data as QuizQuestion[]));
      setQuizAnswerDrafts({});
      setNotice(
        `Generated ${payload.data.length} quiz question${payload.data.length === 1 ? '' : 's'}.`,
      );
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  function setQuizAnswer(questionId: string, selectedOptionIndex: number) {
    setQuizAnswerDrafts((current) => ({
      ...current,
      [questionId]: selectedOptionIndex,
    }));
  }

  async function submitQuizAttempt() {
    if (!activeQuiz) {
      setError('Select a quiz before submitting.');
      return;
    }
    if (!quizQuestions.length) {
      setError('Quiz has no questions to submit.');
      return;
    }

    const answers = quizQuestions.map((question) => ({
      questionId: question.id,
      selectedOptionIndex: quizAnswerDrafts[question.id] ?? -1,
    }));

    if (answers.some((answer) => answer.selectedOptionIndex < 0)) {
      setError('Answer all questions before submitting.');
      return;
    }

    setIsSubmittingQuiz(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/quizzes/${activeQuiz.id}/attempts`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ answers }),
        },
      );

      const payload = (await response.json()) as { data?: QuizAttempt; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to submit quiz');
      }

      setQuizAttempts((current) => [payload.data as QuizAttempt, ...current]);
      setNotice(`Quiz submitted. Score: ${payload.data.score}/${payload.data.totalQuestions}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit quiz');
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  async function generateStudySummary() {
    setIsGeneratingSummary(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/summaries/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNote?.id ?? null,
        }),
      });

      const payload = (await response.json()) as { data?: StudySummary; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to generate study summary');
      }

      setSummaries((current) => [payload.data as StudySummary, ...current]);
      setNotice('Study summary generated.');
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : 'Failed to generate study summary',
      );
    } finally {
      setIsGeneratingSummary(false);
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
    void loadQuizzes();
    void loadSummaries();
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

  useEffect(() => {
    if (!activeQuizId) {
      setQuizQuestions([]);
      setQuizAttempts([]);
      setQuizAnswerDrafts({});
      return;
    }

    void loadQuizDetails(activeQuizId);
  }, [activeQuizId]);

  return (
    <AppShell
      subtitle="Study workspace with notes, flashcards, quizzes, and AI study summaries."
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

          <div className={`${cardClass} space-y-3`}>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Quiz</p>
              <p className="text-xs text-muted-foreground">QUIZ-001 baseline</p>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className={inputClass}
                onChange={(event) => setQuizTitleDraft(event.target.value)}
                placeholder="Quiz title"
                value={quizTitleDraft}
              />
              <button
                className={buttonPrimaryClass}
                disabled={isSavingQuiz}
                onClick={() => void createQuiz()}
                type="button"
              >
                {isSavingQuiz ? 'Creating...' : 'New Quiz'}
              </button>
            </div>

            <input
              className={inputClass}
              onChange={(event) => setQuizQuery(event.target.value)}
              placeholder="Search quizzes..."
              value={quizQuery}
            />

            {isLoadingQuizzes ? (
              <p className="text-sm text-muted-foreground">Loading quizzes...</p>
            ) : filteredQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quizzes yet.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {filteredQuizzes.map((quiz) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-left ${
                      activeQuizId === quiz.id ? 'bg-muted' : 'hover:bg-muted'
                    }`}
                    key={quiz.id}
                    onClick={() => setActiveQuizId(quiz.id)}
                    type="button"
                  >
                    <p className="text-sm font-medium">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {quiz.sourceNoteId ? `Note: ${quiz.sourceNoteId}` : 'No note link'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {activeQuiz ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={isGeneratingQuiz || !activeNote}
                    onClick={() => void generateQuizFromNote()}
                    type="button"
                  >
                    {isGeneratingQuiz ? 'Generating...' : 'Generate from Active Note'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isSubmittingQuiz || quizQuestions.length === 0}
                    onClick={() => void submitQuizAttempt()}
                    type="button"
                  >
                    {isSubmittingQuiz ? 'Submitting...' : 'Submit Attempt'}
                  </button>
                </div>

                {quizQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quiz questions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {quizQuestions.map((question, index) => (
                      <article className="rounded-md border px-3 py-2" key={question.id}>
                        <p className="text-sm font-medium">
                          {index + 1}. {question.prompt}
                        </p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <label
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                              key={`${question.id}-${optionIndex}`}
                            >
                              <input
                                checked={quizAnswerDrafts[question.id] === optionIndex}
                                name={`quiz-${question.id}`}
                                onChange={() => setQuizAnswer(question.id, optionIndex)}
                                type="radio"
                                value={optionIndex}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {quizAttempts.length > 0 ? (
                  <div className="space-y-1 rounded-md border p-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Recent attempts
                    </p>
                    {quizAttempts.slice(0, 3).map((attempt) => (
                      <p className="text-sm" key={attempt.id}>
                        {attempt.score}/{attempt.totalQuestions} -{' '}
                        {new Date(attempt.createdAt).toLocaleString()}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`${cardClass} space-y-3`}>
            <div className="space-y-1">
              <p className="text-sm font-semibold">AI Study Summaries</p>
              <p className="text-xs text-muted-foreground">STUDY-001 baseline</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={buttonPrimaryClass}
                disabled={isGeneratingSummary}
                onClick={() => void generateStudySummary()}
                type="button"
              >
                {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
              </button>
              <p className="text-xs text-muted-foreground">
                Uses active note when selected, otherwise builds from workspace notes.
              </p>
            </div>

            <input
              className={inputClass}
              onChange={(event) => setSummaryQuery(event.target.value)}
              placeholder="Search summaries..."
              value={summaryQuery}
            />

            {isLoadingSummaries ? (
              <p className="text-sm text-muted-foreground">Loading summaries...</p>
            ) : filteredSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No study summaries yet.</p>
            ) : (
              <div className="space-y-2">
                {filteredSummaries.map((summary) => (
                  <article className="rounded-md border px-3 py-2" key={summary.id}>
                    <p className="text-sm font-medium">{summary.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {summary.content}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {summary.sourceNoteId
                        ? `Source note: ${summary.sourceNoteId}`
                        : 'Source: workspace context'}{' '}
                      - {new Date(summary.createdAt).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
