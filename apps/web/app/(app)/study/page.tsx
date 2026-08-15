'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { GraduationCap, ScrollText, StickyNote } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppFieldLabel,
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  isSlideOutlineTitle,
  isStudySummaryTitle,
  studyGenerateButtonLabel,
  studyGenerateSourceDescription,
  studyGenerateStatusMessage,
  type StudyGenerateAction,
} from '@/lib/study/generation-ux';
import { cn } from '@/lib/utils';

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

type TranscriptSource = {
  id: string;
  name: string;
  sourceType?: string | null;
};

export default function StudyPage() {
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const [notes, setNotes] = useState<Note[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSource[]>([]);
  const [generationSource, setGenerationSource] = useState<'note' | 'transcript'>('note');
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
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
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [quizAnswerDrafts, setQuizAnswerDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFailedGenerate, setLastFailedGenerate] = useState<StudyGenerateAction | null>(null);

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

  const hasStudySummaries = useMemo(
    () => summaries.some((summary) => isStudySummaryTitle(summary.title)),
    [summaries],
  );
  const hasSlideOutlines = useMemo(
    () => summaries.some((summary) => isSlideOutlineTitle(summary.title)),
    [summaries],
  );

  const selectedTranscript = useMemo(
    () => transcripts.find((item) => item.id === selectedTranscriptId) ?? null,
    [selectedTranscriptId, transcripts],
  );

  const generationSourceDescription = useMemo(
    () =>
      studyGenerateSourceDescription({
        generationSource,
        noteTitle: activeNote?.title ?? null,
        transcriptName: selectedTranscript?.name ?? null,
      }),
    [activeNote?.title, generationSource, selectedTranscript?.name],
  );

  const activeGenerateAction = useMemo((): StudyGenerateAction | null => {
    if (isGeneratingSummary) {
      return 'summary';
    }
    if (isGeneratingOutline) {
      return 'outline';
    }
    if (isGeneratingCards) {
      return 'cards';
    }
    if (isGeneratingQuiz) {
      return 'quiz';
    }
    return null;
  }, [isGeneratingCards, isGeneratingOutline, isGeneratingQuiz, isGeneratingSummary]);

  function beginGenerate() {
    setLastFailedGenerate(null);
    setError(null);
    setNotice(null);
  }

  function failGenerate(action: StudyGenerateAction, message: string) {
    setLastFailedGenerate(action);
    setError(message);
  }

  function retryLastGenerate() {
    if (!lastFailedGenerate) {
      return;
    }

    switch (lastFailedGenerate) {
      case 'summary':
        void generateStudySummary();
        break;
      case 'outline':
        void generateSlideOutline();
        break;
      case 'cards':
        void generateCardsFromNote();
        break;
      case 'quiz':
        void generateQuizFromNote();
        break;
    }
  }

  async function loadNotes() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/notes`);
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

  async function loadTranscripts() {
    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/transcripts`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as { data?: TranscriptSource[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load transcripts');
      }
      const textTranscripts = (payload.data ?? []).filter((item) => {
        const name = item.name.toLowerCase();
        return (
          name.endsWith('.txt') ||
          name.endsWith('.md') ||
          name.endsWith('.vtt') ||
          name.endsWith('.srt') ||
          item.sourceType === 'transcript' ||
          item.sourceType === 'txt' ||
          item.sourceType === 'markdown'
        );
      });
      setTranscripts(textTranscripts);
      setSelectedTranscriptId((current) => {
        if (current && textTranscripts.some((item) => item.id === current)) {
          return current;
        }
        return textTranscripts[0]?.id ?? null;
      });
    } catch (loadError) {
      console.warn('Failed to load transcripts for study generation', loadError);
      setTranscripts([]);
      setSelectedTranscriptId(null);
    }
  }

  function buildGenerationBody(): { noteId?: string; sourceId?: string } {
    if (generationSource === 'transcript') {
      if (!selectedTranscriptId) {
        throw new Error('Select a transcript source for generation.');
      }
      return { sourceId: selectedTranscriptId };
    }
    if (!activeNoteId) {
      throw new Error('Select a source note for generation.');
    }
    return { noteId: activeNoteId };
  }

  async function loadDecks() {
    setIsLoadingDecks(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/flashcards/decks`);
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
        `/api/v1/workspaces/${workspaceId}/flashcards/decks/${deckId}/cards`,
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/quizzes`);
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
        fetch(`/api/v1/workspaces/${workspaceId}/quizzes/${quizId}`),
        fetch(`/api/v1/workspaces/${workspaceId}/quizzes/${quizId}/attempts`),
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/summaries`);
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/notes`, {
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/flashcards/decks`, {
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
        `/api/v1/workspaces/${workspaceId}/flashcards/decks/${activeDeck.id}/cards`,
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

    beginGenerate();
    setIsGeneratingCards(true);

    try {
      const body = buildGenerationBody();
      const response = await fetch(
        `/api/v1/workspaces/${workspaceId}/flashcards/decks/${activeDeck.id}/generate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
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
      failGenerate(
        'cards',
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
        `/api/v1/workspaces/${workspaceId}/flashcards/decks/${activeDeck.id}`,
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/quizzes`, {
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

    beginGenerate();
    setIsGeneratingQuiz(true);

    try {
      const body = buildGenerationBody();
      const response = await fetch(
        `/api/v1/workspaces/${workspaceId}/quizzes/${activeQuiz.id}/generate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
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
      failGenerate(
        'quiz',
        generateError instanceof Error ? generateError.message : 'Failed to generate quiz',
      );
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
        `/api/v1/workspaces/${workspaceId}/quizzes/${activeQuiz.id}/attempts`,
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
    beginGenerate();
    setIsGeneratingSummary(true);

    try {
      const body = buildGenerationBody();
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/summaries/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, kind: 'summary' }),
      });

      const payload = (await response.json()) as { data?: StudySummary; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to generate study summary');
      }

      setSummaries((current) => [payload.data as StudySummary, ...current]);
      setNotice('Study summary generated.');
    } catch (generateError) {
      failGenerate(
        'summary',
        generateError instanceof Error ? generateError.message : 'Failed to generate study summary',
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  async function generateSlideOutline() {
    beginGenerate();
    setIsGeneratingOutline(true);

    try {
      const body = buildGenerationBody();
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/summaries/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, kind: 'outline' }),
      });

      const payload = (await response.json()) as { data?: StudySummary; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to generate slide outline');
      }

      setSummaries((current) => [payload.data as StudySummary, ...current]);
      setNotice('Slide outline generated.');
    } catch (generateError) {
      failGenerate(
        'outline',
        generateError instanceof Error ? generateError.message : 'Failed to generate slide outline',
      );
    } finally {
      setIsGeneratingOutline(false);
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/notes/${activeNote.id}`, {
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/notes/${activeNote.id}`, {
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
    if (!workspaceId) {
      return;
    }
    void loadNotes();
    void loadTranscripts();
    void loadDecks();
    void loadQuizzes();
    void loadSummaries();
  }, [workspaceId]);

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

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="study">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell pageId="study">
      <AppPageFrame>
        <AppPanel>
          <AppPanelHeader
            description="Choose a note or transcript before generating study material."
            title="Generation source"
          />
          <AppPanelBody className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
                <AppFieldLabel htmlFor="study-generation-source">Source type</AppFieldLabel>
                <select
                  aria-label="Generation source type"
                  className={cn(appSurface.field, 'appearance-none')}
                  id="study-generation-source"
                  onChange={(event) =>
                    setGenerationSource(event.target.value === 'transcript' ? 'transcript' : 'note')
                  }
                  value={generationSource}
                >
                  <option value="note">Active note</option>
                  <option value="transcript">Transcript file</option>
                </select>
              </div>
              {generationSource === 'transcript' ? (
                <div className="min-w-0 flex-1 space-y-1.5">
                  <AppFieldLabel htmlFor="study-transcript-source">Transcript</AppFieldLabel>
                  <select
                    aria-label="Transcript source"
                    className={cn(appSurface.field, 'appearance-none')}
                    id="study-transcript-source"
                    onChange={(event) => setSelectedTranscriptId(event.target.value || null)}
                    value={selectedTranscriptId ?? ''}
                  >
                    {transcripts.length === 0 ? (
                      <option value="">No transcript text files yet</option>
                    ) : (
                      transcripts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:pb-2.5">
                  Uses the note selected in the notes list
                  {activeNote ? ` (${activeNote.title})` : ''}.
                </p>
              )}
            </div>
            {error ? (
              <div className={cn(appSurface.alert, 'flex flex-wrap items-center gap-2')} role="alert">
                <p className="flex-1">{error}</p>
                {lastFailedGenerate ? (
                  <Button
                    className="rounded-xl"
                    onClick={() => retryLastGenerate()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Try again
                  </Button>
                ) : null}
              </div>
            ) : null}
            {notice ? (
              <p className={appSurface.notice} role="status">
                {notice}
              </p>
            ) : null}
            {activeGenerateAction ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
                {studyGenerateStatusMessage(activeGenerateAction, generationSourceDescription)}
              </p>
            ) : null}
          </AppPanelBody>
        </AppPanel>

        <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[280px_1fr] lg:items-start">
          <AppPanel className="lg:sticky lg:top-4">
            <AppPanelHeader
              description="Write notes, then generate cards, quizzes, and summaries."
              title="Notes"
            />
            <AppPanelBody className="space-y-3">
              <Input
                aria-label="Search notes"
                className="rounded-xl"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes..."
                value={query}
              />

              <Button
                className="w-full rounded-xl sm:w-auto"
                disabled={isSaving}
                onClick={() => void createNote()}
                type="button"
              >
                {isSaving ? 'Working...' : 'New Note'}
              </Button>

              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading notes...</p>
                ) : filteredNotes.length === 0 ? (
                  <EmptyState
                    compact
                    description="Create a note here, or pick a transcript above, then generate study material."
                    icon={StickyNote}
                    title="No notes yet"
                  />
                ) : (
                  filteredNotes.map((note) => (
                    <button
                      aria-pressed={activeNoteId === note.id}
                      className={cn(
                        appSurface.inset,
                        'w-full px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
                        activeNoteId === note.id
                          ? 'border-zinc-300 bg-white ring-1 ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-600'
                          : 'hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                      )}
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      type="button"
                    >
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {note.title}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {note.content || 'Empty note'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </AppPanelBody>
          </AppPanel>

          <div className="min-w-0 space-y-4 sm:space-y-5">
            <AppPanel>
              <AppPanelHeader
                description="Edit the selected note, then save before generating."
                title="Note editor"
              />
              <AppPanelBody className="space-y-3">
                {!activeNote ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Select a note or create one to start writing.
                  </p>
                ) : (
                  <>
                    <Input
                      className="rounded-xl"
                      onChange={(event) => setTitleDraft(event.target.value)}
                      placeholder="Note title"
                      value={titleDraft}
                    />
                    <Textarea
                      className="min-h-[240px] rounded-xl"
                      onChange={(event) => setContentDraft(event.target.value)}
                      placeholder="Write your note..."
                      value={contentDraft}
                    />
                    {error ? (
                      <div className={appSurface.alert} role="alert">
                        {error}
                      </div>
                    ) : null}
                    {notice ? (
                      <div className={appSurface.notice} role="status">
                        {notice}
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isSaving || isDeleting}
                        onClick={() => void saveActiveNote()}
                        type="button"
                      >
                        {isSaving ? 'Saving...' : 'Save Note'}
                      </Button>
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isSaving || isDeleting}
                        onClick={() => void deleteActiveNote()}
                        type="button"
                        variant="outline"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Note'}
                      </Button>
                    </div>
                  </>
                )}
              </AppPanelBody>
            </AppPanel>

            <AppPanel>
              <AppPanelHeader
                description="Build decks from a note or transcript."
                title="Flashcards"
              />
              <AppPanelBody className="space-y-3">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    className="rounded-xl"
                    onChange={(event) => setDeckTitleDraft(event.target.value)}
                    placeholder="Deck title"
                    value={deckTitleDraft}
                  />
                  <Button
                    className="w-full rounded-xl md:w-auto"
                    disabled={isSavingDeck}
                    onClick={() => void createDeck()}
                    type="button"
                  >
                    {isSavingDeck ? 'Creating...' : 'New Deck'}
                  </Button>
                </div>

                <Input
                  aria-label="Search flashcard decks"
                  className="rounded-xl"
                  onChange={(event) => setDeckQuery(event.target.value)}
                  placeholder="Search decks..."
                  value={deckQuery}
                />

                {isLoadingDecks ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading decks...</p>
                ) : filteredDecks.length === 0 ? (
                  <EmptyState
                    compact
                    description="Generate flashcards from a note or create a deck to get started."
                    icon={GraduationCap}
                    title="No flashcard decks yet"
                  />
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {filteredDecks.map((deck) => (
                      <button
                        aria-pressed={activeDeckId === deck.id}
                        className={cn(
                          appSurface.inset,
                          'px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
                          activeDeckId === deck.id
                            ? 'border-zinc-300 bg-white ring-1 ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-600'
                            : 'hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                        )}
                        key={deck.id}
                        onClick={() => setActiveDeckId(deck.id)}
                        type="button"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {deck.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {deck.sourceNoteId ? `Note: ${deck.sourceNoteId}` : 'No note link'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {activeDeck ? (
                  <div className={cn(appSurface.inset, 'space-y-3 p-3.5')}>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Deck: {activeDeck.title}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isGeneratingCards}
                        onClick={() => void generateCardsFromNote()}
                        type="button"
                      >
                        {studyGenerateButtonLabel('cards', isGeneratingCards, cards.length > 0)}
                      </Button>
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isDeletingDeck}
                        onClick={() => void deleteDeck()}
                        type="button"
                        variant="outline"
                      >
                        {isDeletingDeck ? 'Deleting...' : 'Delete Deck'}
                      </Button>
                    </div>
                    {isGeneratingCards ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
                        {studyGenerateStatusMessage('cards', generationSourceDescription)}
                      </p>
                    ) : null}

                    <div className="grid gap-2">
                      <Input
                        className="rounded-xl"
                        onChange={(event) => setCardQuestionDraft(event.target.value)}
                        placeholder="Question"
                        value={cardQuestionDraft}
                      />
                      <Textarea
                        className="min-h-20 rounded-xl"
                        onChange={(event) => setCardAnswerDraft(event.target.value)}
                        placeholder="Answer"
                        value={cardAnswerDraft}
                      />
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isSavingCard}
                        onClick={() => void addCardToDeck()}
                        type="button"
                        variant="outline"
                      >
                        {isSavingCard ? 'Adding...' : 'Add Card'}
                      </Button>
                    </div>

                    {cards.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        No flashcards in this deck yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cards.map((card) => (
                          <article
                            className={cn(
                              appSurface.inset,
                              'px-3 py-2.5 transition-colors hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                            )}
                            key={card.id}
                          >
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              Q
                            </p>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">{card.question}</p>
                            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              A
                            </p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{card.answer}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </AppPanelBody>
            </AppPanel>

            <AppPanel>
              <AppPanelHeader
                description="Generate questions and track attempts."
                title="Quiz"
              />
              <AppPanelBody className="space-y-3">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    className="rounded-xl"
                    onChange={(event) => setQuizTitleDraft(event.target.value)}
                    placeholder="Quiz title"
                    value={quizTitleDraft}
                  />
                  <Button
                    className="w-full rounded-xl md:w-auto"
                    disabled={isSavingQuiz}
                    onClick={() => void createQuiz()}
                    type="button"
                  >
                    {isSavingQuiz ? 'Creating...' : 'New Quiz'}
                  </Button>
                </div>

                <Input
                  aria-label="Search quizzes"
                  className="rounded-xl"
                  onChange={(event) => setQuizQuery(event.target.value)}
                  placeholder="Search quizzes..."
                  value={quizQuery}
                />

                {isLoadingQuizzes ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading quizzes...</p>
                ) : filteredQuizzes.length === 0 ? (
                  <EmptyState
                    compact
                    description="Create a quiz, select a note or transcript, then generate questions."
                    icon={GraduationCap}
                    title="No quizzes yet"
                  />
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {filteredQuizzes.map((quiz) => (
                      <button
                        aria-pressed={activeQuizId === quiz.id}
                        className={cn(
                          appSurface.inset,
                          'px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
                          activeQuizId === quiz.id
                            ? 'border-zinc-300 bg-white ring-1 ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-600'
                            : 'hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                        )}
                        key={quiz.id}
                        onClick={() => setActiveQuizId(quiz.id)}
                        type="button"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {quiz.sourceNoteId ? `Note: ${quiz.sourceNoteId}` : 'No note link'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {activeQuiz ? (
                  <div className={cn(appSurface.inset, 'space-y-3 p-3.5')}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isGeneratingQuiz}
                        onClick={() => void generateQuizFromNote()}
                        type="button"
                      >
                        {studyGenerateButtonLabel('quiz', isGeneratingQuiz, quizQuestions.length > 0)}
                      </Button>
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isSubmittingQuiz || quizQuestions.length === 0}
                        onClick={() => void submitQuizAttempt()}
                        type="button"
                        variant="outline"
                      >
                        {isSubmittingQuiz ? 'Submitting...' : 'Submit Attempt'}
                      </Button>
                    </div>
                    {isGeneratingQuiz ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
                        {studyGenerateStatusMessage('quiz', generationSourceDescription)}
                      </p>
                    ) : null}

                    {quizQuestions.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">No quiz questions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {quizQuestions.map((question, index) => (
                          <article
                            className={cn(
                              appSurface.inset,
                              'px-3 py-2.5 transition-colors hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                            )}
                            key={question.id}
                          >
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {index + 1}. {question.prompt}
                            </p>
                            <div className="mt-2 space-y-1">
                              {question.options.map((option, optionIndex) => (
                                <label
                                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                                  key={`${question.id}-${optionIndex}`}
                                >
                                  <input
                                    aria-label={`Select answer ${option}`}
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
                      <div className={cn(appSurface.inset, 'space-y-1 p-3')}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Recent attempts
                        </p>
                        {quizAttempts.slice(0, 3).map((attempt) => (
                          <p className="text-sm text-zinc-700 dark:text-zinc-300" key={attempt.id}>
                            {attempt.score}/{attempt.totalQuestions} -{' '}
                            {new Date(attempt.createdAt).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </AppPanelBody>
            </AppPanel>

            <AppPanel>
              <AppPanelHeader
                description="Summaries and slide outlines from your sources."
                title="AI Study Summaries"
              />
              <AppPanelBody className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    className="w-full rounded-xl sm:w-auto"
                    disabled={isGeneratingSummary}
                    onClick={() => void generateStudySummary()}
                    type="button"
                  >
                    {studyGenerateButtonLabel('summary', isGeneratingSummary, hasStudySummaries)}
                  </Button>
                  <Button
                    className="w-full rounded-xl sm:w-auto"
                    disabled={isGeneratingOutline}
                    onClick={() => void generateSlideOutline()}
                    type="button"
                    variant="outline"
                  >
                    {studyGenerateButtonLabel('outline', isGeneratingOutline, hasSlideOutlines)}
                  </Button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Uses the Generation source above (note or transcript).
                  </p>
                </div>
                {isGeneratingSummary || isGeneratingOutline ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
                    {studyGenerateStatusMessage(
                      isGeneratingSummary ? 'summary' : 'outline',
                      generationSourceDescription,
                    )}
                  </p>
                ) : null}

                <Input
                  aria-label="Search generated study summaries"
                  className="rounded-xl"
                  onChange={(event) => setSummaryQuery(event.target.value)}
                  placeholder="Search summaries..."
                  value={summaryQuery}
                />

                {isLoadingSummaries ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : filteredSummaries.length === 0 ? (
                  <EmptyState
                    compact
                    action={
                      <Button
                        className="w-full rounded-xl sm:w-auto"
                        disabled={isGeneratingSummary}
                        onClick={() => void generateStudySummary()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {studyGenerateButtonLabel('summary', isGeneratingSummary, hasStudySummaries)}
                      </Button>
                    }
                    description="Generate a summary from your selected note or transcript."
                    icon={ScrollText}
                    title="No study summaries yet"
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredSummaries.map((summary) => (
                      <article
                        className={cn(
                          appSurface.inset,
                          'px-3.5 py-3 transition-colors hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                        )}
                        key={summary.id}
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {summary.title}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                          {summary.content}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {summary.sourceNoteId
                            ? `Source note: ${summary.sourceNoteId}`
                            : 'Source: workspace context'}{' '}
                          - {new Date(summary.createdAt).toLocaleString()}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </AppPanelBody>
            </AppPanel>
          </div>
        </div>
      </AppPageFrame>
    </AppPageShell>
  );
}
