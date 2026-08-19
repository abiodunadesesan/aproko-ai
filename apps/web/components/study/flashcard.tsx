'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type FlashcardItem = {
  id: string;
  question: string;
  answer: string;
};

type FlashcardProps = {
  card: FlashcardItem;
  className?: string;
  indexLabel?: string;
};

export function Flashcard({ card, className, indexLabel }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <button
      aria-pressed={isFlipped}
      className={cn(
        'group relative h-52 w-full max-w-md perspective-[1200px] text-left sm:h-56',
        className,
      )}
      onClick={() => setIsFlipped((value) => !value)}
      type="button"
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        className="relative h-full w-full transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
        transition={
          reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 22 }
        }
      >
        <div
          className={cn(
            'absolute inset-0 flex flex-col rounded-2xl border border-black/[0.08] bg-gradient-to-br from-white to-zinc-50 p-5 shadow-premium',
            'dark:border-white/[0.08] dark:from-zinc-900 dark:to-zinc-950 dark:shadow-premium-dark',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {indexLabel ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600/80 dark:text-zinc-400/90">
              {indexLabel}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Question
          </p>
          <p className="mt-2 line-clamp-6 flex-1 text-base font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">
            {card.question}
          </p>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Tap to reveal answer</p>
        </div>

        <div
          className={cn(
            'absolute inset-0 flex flex-col rounded-2xl border border-zinc-400/25 bg-gradient-to-br from-zinc-50 to-white p-5 shadow-premium',
            'dark:border-zinc-500/25 dark:from-zinc-900/40 dark:to-zinc-950 dark:shadow-premium-dark',
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-700/80 dark:text-zinc-300/90">
            Answer
          </p>
          <p className="mt-2 line-clamp-7 flex-1 text-base leading-relaxed text-zinc-800 dark:text-zinc-100">
            {card.answer}
          </p>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Tap to flip back</p>
        </div>
      </motion.div>
    </button>
  );
}

type FlashcardDeckProps = {
  cards: FlashcardItem[];
  emptyMessage?: string;
  className?: string;
};

export function FlashcardDeck({
  cards,
  emptyMessage = 'No flashcards in this deck yet.',
  className,
}: FlashcardDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = cards[activeIndex] ?? null;

  if (!cards.length) {
    return (
      <p className="rounded-2xl border border-dashed border-black/[0.08] px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  if (!activeCard) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Flashcard card={activeCard} indexLabel={`Card ${activeIndex + 1} of ${cards.length}`} />
      <div className="flex items-center justify-between gap-2">
        <button
          className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((value) => Math.max(0, value - 1))}
          type="button"
        >
          Previous
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {activeIndex + 1} / {cards.length}
        </p>
        <button
          className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
          disabled={activeIndex >= cards.length - 1}
          onClick={() => setActiveIndex((value) => Math.min(cards.length - 1, value + 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
