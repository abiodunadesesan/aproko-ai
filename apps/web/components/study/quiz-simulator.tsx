'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type QuizSimulatorQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
};

export type QuizSimulatorAttempt = {
  id: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

type QuizSimulatorProps = {
  title: string;
  questions: QuizSimulatorQuestion[];
  attempts?: QuizSimulatorAttempt[];
  isSubmitting?: boolean;
  onSubmit?: (answers: Record<string, number>) => void | Promise<void>;
  className?: string;
};

export function QuizSimulator({
  title,
  questions,
  attempts = [],
  isSubmitting = false,
  onSubmit,
  className,
}: QuizSimulatorProps) {
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const score = useMemo(() => {
    if (!revealed) {
      return null;
    }
    let correct = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correctOptionIndex) {
        correct += 1;
      }
    }
    return { correct, total: questions.length };
  }, [answers, questions, revealed]);

  const activeQuestion = questions[activeIndex] ?? null;

  function selectOption(questionId: string, optionIndex: number) {
    if (revealed) {
      return;
    }
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    if (!questions.length || revealed) {
      return;
    }
    setRevealed(true);
    await onSubmit?.(answers);
  }

  function resetQuiz() {
    setAnswers({});
    setRevealed(false);
    setActiveIndex(0);
  }

  if (!questions.length) {
    return (
      <p className="rounded-2xl border border-dashed border-black/[0.08] px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        Generate quiz questions to start the simulator.
      </p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Question {activeIndex + 1} of {questions.length}
          </p>
        </div>
        {score ? (
          <p className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            Score {score.correct}/{score.total}
          </p>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-500 transition-all duration-300 dark:bg-zinc-400"
          style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {activeQuestion ? (
        reduceMotion ? (
          <QuizQuestionCard
            activeIndex={activeIndex}
            answers={answers}
            onSelect={selectOption}
            question={activeQuestion}
            revealed={revealed}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key={activeQuestion.id}
              transition={{ duration: 0.18 }}
            >
              <QuizQuestionCard
                activeIndex={activeIndex}
                answers={answers}
                onSelect={selectOption}
                question={activeQuestion}
                revealed={revealed}
              />
            </motion.div>
          </AnimatePresence>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((value) => Math.max(0, value - 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={activeIndex >= questions.length - 1}
          onClick={() => setActiveIndex((value) => Math.min(questions.length - 1, value + 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
        {!revealed ? (
          <Button
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            size="sm"
            type="button"
          >
            {isSubmitting ? 'Submitting…' : 'Submit quiz'}
          </Button>
        ) : (
          <Button onClick={resetQuiz} size="sm" type="button" variant="outline">
            Try again
          </Button>
        )}
      </div>

      {attempts.length > 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Recent attempts
          </p>
          <ul className="mt-2 space-y-1">
            {attempts.slice(0, 3).map((attempt) => (
              <li className="text-sm text-zinc-700 dark:text-zinc-300" key={attempt.id}>
                {attempt.score}/{attempt.totalQuestions} ·{' '}
                {new Date(attempt.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type QuizQuestionCardProps = {
  question: QuizSimulatorQuestion;
  activeIndex: number;
  answers: Record<string, number>;
  revealed: boolean;
  onSelect: (questionId: string, optionIndex: number) => void;
};

function QuizQuestionCard({
  question,
  activeIndex,
  answers,
  revealed,
  onSelect,
}: QuizQuestionCardProps) {
  const selected = answers[question.id];

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white/80 p-4 shadow-premium backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-premium-dark sm:p-5">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {activeIndex + 1}. {question.prompt}
      </p>
      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const isCorrect = optionIndex === question.correctOptionIndex;
          const showCorrect = revealed && isCorrect;
          const showIncorrect = revealed && isSelected && !isCorrect;

          return (
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                isSelected && !revealed && 'border-zinc-500/40 bg-zinc-500/10',
                !isSelected &&
                  !revealed &&
                  'border-black/[0.06] hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]',
                showCorrect && 'border-emerald-500/40 bg-emerald-500/10',
                showIncorrect && 'border-red-500/35 bg-red-500/10',
              )}
              key={`${question.id}-${optionIndex}`}
              onClick={() => onSelect(question.id, optionIndex)}
              type="button"
            >
              <span
                className={cn(
                  'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                  isSelected
                    ? 'border-zinc-500 text-zinc-600 dark:border-zinc-400 dark:text-zinc-300'
                    : 'border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400',
                )}
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="text-zinc-700 dark:text-zinc-200">{option}</span>
            </button>
          );
        })}
      </div>
      {revealed && question.explanation ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {question.explanation}
        </p>
      ) : null}
    </article>
  );
}
