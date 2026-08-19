'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, MessageSquare } from 'lucide-react';
import { ChatPromptInput } from '@/components/app/chat-prompt-input';
import { AppPanel, AppPanelBody, AppPanelHeader } from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { AudioRecorder } from '@/components/study/audio-recorder';
import { FlashcardDeck } from '@/components/study/flashcard';
import { PresentationBuilder } from '@/components/study/presentation-builder';
import {
  QuizSimulator,
  type QuizSimulatorAttempt,
  type QuizSimulatorQuestion,
} from '@/components/study/quiz-simulator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isSlideOutlineTitle } from '@/lib/study/generation-ux';
import { useWorkspace } from '@/components/workspace/workspace-provider';

const DASHBOARD_CHAT_DRAFT_KEY = 'aproko.dashboard.chat-draft';

type ChatSession = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  updatedAt: string;
};

type FlashcardDeckRecord = {
  id: string;
  title: string;
};

type FlashcardRecord = {
  id: string;
  question: string;
  answer: string;
};

type QuizRecord = {
  id: string;
  title: string;
};

type StudySummaryRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

function PanelLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export function DashboardChatPanel() {
  const router = useRouter();
  const { workspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadSessions() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}/chat/sessions`);
        const payload = (await response.json()) as { data?: ChatSession[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load chat sessions');
        }
        if (!cancelled) {
          setSessions(payload.data ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load chat sessions');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  function startChat(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }
    window.sessionStorage.setItem(DASHBOARD_CHAT_DRAFT_KEY, trimmed);
    router.push('/chat');
  }

  if (isWorkspaceLoading || isLoading) {
    return <PanelLoading />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <AppPanel>
        <AppPanelHeader
          action={
            <Button asChild className="rounded-full" size="sm" variant="ghost">
              <Link href="/chat">
                Open full chat
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
          description="Recent grounded conversations in this workspace."
          title="Chat sessions"
        />
        <AppPanelBody className="space-y-2 pt-0 sm:pt-0">
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          {sessions.length === 0 ? (
            <EmptyState
              compact
              description="Ask a question with citations from your library and memory."
              icon={MessageSquare}
              title="No chat sessions yet"
            />
          ) : (
            sessions.slice(0, 6).map((session) => (
              <Link
                className="block rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-3 transition hover:border-zinc-400/25 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                href={`/chat?session=${session.id}`}
                key={session.id}
              >
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {session.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {session.lastMessageAt
                    ? new Date(session.lastMessageAt).toLocaleString()
                    : new Date(session.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))
          )}
        </AppPanelBody>
      </AppPanel>

      <AppPanel>
        <AppPanelHeader
          description="Start a grounded conversation without leaving the dashboard."
          title="Quick ask"
        />
        <AppPanelBody className="space-y-4 pt-0 sm:pt-0">
          <ChatPromptInput
            error={null}
            input={input}
            isListening={false}
            isSending={false}
            isTranscribingVoice={false}
            onChange={setInput}
            onSubmit={startChat}
            onToggleVoice={() => {}}
            textareaRef={textareaRef}
          />
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Record a lecture
            </p>
            <AudioRecorder workspaceId={workspaceId} />
          </div>
        </AppPanelBody>
      </AppPanel>
    </div>
  );
}

export function DashboardFlashcardsPanel() {
  const router = useRouter();
  const { workspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const [decks, setDecks] = useState<FlashcardDeckRecord[]>([]);
  const [cards, setCards] = useState<FlashcardRecord[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoadingDecks(false);
      return;
    }

    let cancelled = false;
    async function loadDecks() {
      setIsLoadingDecks(true);
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}/flashcards/decks`);
        const payload = (await response.json()) as { data?: FlashcardDeckRecord[] };
        if (!cancelled) {
          const nextDecks = payload.data ?? [];
          setDecks(nextDecks);
          setActiveDeckId((current) => current ?? nextDecks[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDecks(false);
        }
      }
    }

    void loadDecks();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !activeDeckId) {
      setCards([]);
      return;
    }

    let cancelled = false;
    async function loadCards() {
      setIsLoadingCards(true);
      try {
        const response = await fetch(
          `/api/v1/workspaces/${workspaceId}/flashcards/decks/${activeDeckId}/cards`,
        );
        const payload = (await response.json()) as { data?: FlashcardRecord[] };
        if (!cancelled) {
          setCards(payload.data ?? []);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCards(false);
        }
      }
    }

    void loadCards();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, activeDeckId]);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [activeDeckId, decks],
  );

  if (isWorkspaceLoading || isLoadingDecks) {
    return <PanelLoading />;
  }

  return (
    <AppPanel>
      <AppPanelHeader
        action={
          <Button
            className="rounded-full"
            onClick={() => router.push('/study')}
            size="sm"
            variant="outline"
          >
            Manage in Study
          </Button>
        }
        description="Review generated decks with 3D flip cards."
        title={activeDeck ? activeDeck.title : 'Flashcards'}
      />
      <AppPanelBody className="space-y-4 pt-0 sm:pt-0">
        {decks.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {decks.slice(0, 6).map((deck) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  deck.id === activeDeckId
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'border border-black/[0.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5'
                }`}
                key={deck.id}
                onClick={() => setActiveDeckId(deck.id)}
                type="button"
              >
                {deck.title}
              </button>
            ))}
          </div>
        ) : null}

        {isLoadingCards ? (
          <PanelLoading />
        ) : (
          <FlashcardDeck
            cards={cards.map((card) => ({
              id: card.id,
              question: card.question,
              answer: card.answer,
            }))}
            emptyMessage="No flashcards yet. Generate a deck from Study."
          />
        )}
      </AppPanelBody>
    </AppPanel>
  );
}

export function DashboardQuizzesPanel() {
  const router = useRouter();
  const { workspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizSimulatorQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizSimulatorAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuizDetails = useCallback(
    async (quizId: string) => {
      if (!workspaceId) {
        return;
      }
      const [detailRes, attemptsRes] = await Promise.all([
        fetch(`/api/v1/workspaces/${workspaceId}/quizzes/${quizId}`),
        fetch(`/api/v1/workspaces/${workspaceId}/quizzes/${quizId}/attempts`),
      ]);
      const detailPayload = (await detailRes.json()) as {
        data?: { questions: QuizSimulatorQuestion[] };
      };
      const attemptsPayload = (await attemptsRes.json()) as { data?: QuizSimulatorAttempt[] };
      setQuestions(detailPayload.data?.questions ?? []);
      setAttempts(attemptsPayload.data ?? []);
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadQuizzes() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}/quizzes`);
        const payload = (await response.json()) as { data?: QuizRecord[] };
        if (cancelled) {
          return;
        }
        const nextQuizzes = payload.data ?? [];
        setQuizzes(nextQuizzes);
        const nextQuizId = nextQuizzes[0]?.id ?? null;
        setActiveQuizId(nextQuizId);
        if (nextQuizId) {
          await loadQuizDetails(nextQuizId);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadQuizzes();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, loadQuizDetails]);

  async function handleQuizChange(quizId: string) {
    setActiveQuizId(quizId);
    await loadQuizDetails(quizId);
  }

  async function submitAttempt(answers: Record<string, number>) {
    if (!workspaceId || !activeQuizId || !questions.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadAnswers = questions.map((question) => ({
        questionId: question.id,
        selectedOptionIndex: answers[question.id] ?? -1,
      }));
      await fetch(`/api/v1/workspaces/${workspaceId}/quizzes/${activeQuizId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payloadAnswers }),
      });
      await loadQuizDetails(activeQuizId);
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeQuiz = quizzes.find((quiz) => quiz.id === activeQuizId) ?? null;

  if (isWorkspaceLoading || isLoading) {
    return <PanelLoading />;
  }

  return (
    <AppPanel>
      <AppPanelHeader
        action={
          <Button
            className="rounded-full"
            onClick={() => router.push('/study')}
            size="sm"
            variant="outline"
          >
            Manage in Study
          </Button>
        }
        description="Run a quiz simulator with scoring and attempt history."
        title={activeQuiz?.title ?? 'Quiz simulator'}
      />
      <AppPanelBody className="space-y-4 pt-0 sm:pt-0">
        {quizzes.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {quizzes.slice(0, 6).map((quiz) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  quiz.id === activeQuizId
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'border border-black/[0.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5'
                }`}
                key={quiz.id}
                onClick={() => void handleQuizChange(quiz.id)}
                type="button"
              >
                {quiz.title}
              </button>
            ))}
          </div>
        ) : null}

        <QuizSimulator
          attempts={attempts}
          isSubmitting={isSubmitting}
          onSubmit={submitAttempt}
          questions={questions}
          title={activeQuiz?.title ?? 'Quiz'}
        />
      </AppPanelBody>
    </AppPanel>
  );
}

export function DashboardPresentationsPanel() {
  const router = useRouter();
  const { workspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const [outlines, setOutlines] = useState<StudySummaryRecord[]>([]);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadOutlines() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}/summaries`);
        const payload = (await response.json()) as { data?: StudySummaryRecord[] };
        if (cancelled) {
          return;
        }
        const slideOutlines = (payload.data ?? []).filter((entry) =>
          isSlideOutlineTitle(entry.title),
        );
        setOutlines(slideOutlines);
        setActiveOutlineId(slideOutlines[0]?.id ?? null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOutlines();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const activeOutline = useMemo(
    () => outlines.find((entry) => entry.id === activeOutlineId) ?? null,
    [activeOutlineId, outlines],
  );

  if (isWorkspaceLoading || isLoading) {
    return <PanelLoading />;
  }

  return (
    <AppPanel>
      <AppPanelHeader
        action={
          <Button
            className="rounded-full"
            onClick={() => router.push('/study')}
            size="sm"
            variant="outline"
          >
            Generate in Study
          </Button>
        }
        description="Browse slide-ready outlines with animated previews."
        title="Presentation builder"
      />
      <AppPanelBody className="space-y-4 pt-0 sm:pt-0">
        {outlines.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {outlines.slice(0, 5).map((outline) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  outline.id === activeOutlineId
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'border border-black/[0.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5'
                }`}
                key={outline.id}
                onClick={() => setActiveOutlineId(outline.id)}
                type="button"
              >
                {outline.title}
              </button>
            ))}
          </div>
        ) : null}

        <PresentationBuilder
          onOpenStudy={() => router.push('/study')}
          outline={
            activeOutline
              ? {
                  id: activeOutline.id,
                  title: activeOutline.title,
                  content: activeOutline.content,
                  createdAt: activeOutline.createdAt,
                }
              : null
          }
        />
      </AppPanelBody>
    </AppPanel>
  );
}

export { DASHBOARD_CHAT_DRAFT_KEY };
