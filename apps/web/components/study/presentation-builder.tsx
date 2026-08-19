'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseSlideOutlineMarkdown, type ParsedSlide } from '@/lib/study/slide-outline';

export type PresentationOutline = {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
};

type PresentationBuilderProps = {
  outline: PresentationOutline | null;
  className?: string;
  onOpenStudy?: () => void;
};

export function PresentationBuilder({ outline, className, onOpenStudy }: PresentationBuilderProps) {
  const reduceMotion = useReducedMotion();
  const slides = useMemo(
    () => (outline ? parseSlideOutlineMarkdown(outline.content) : []),
    [outline],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? null;

  if (!outline) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-black/[0.08] px-4 py-10 text-center dark:border-white/10',
          className,
        )}
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          No presentation outline yet
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate a slide outline from a note or transcript in Study.
        </p>
        {onOpenStudy ? (
          <Button className="mt-4 rounded-full" onClick={onOpenStudy} size="sm" type="button">
            Open Study
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]', className)}>
      <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-3 shadow-premium backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-premium-dark">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          Slides
        </p>
        <ul className="mt-2 max-h-[22rem] space-y-1 overflow-y-auto">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                className={cn(
                  'w-full rounded-xl px-3 py-2 text-left text-sm transition',
                  index === activeIndex
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
                )}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  {slide.kind === 'title'
                    ? 'Title'
                    : slide.kind === 'closing'
                      ? 'Closing'
                      : `Slide ${index + 1}`}
                </span>
                <span className="mt-0.5 block truncate font-medium">{slide.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-h-[18rem]">
        {activeSlide ? (
          reduceMotion ? (
            <SlidePreview
              index={activeIndex}
              outlineTitle={outline.title}
              slide={activeSlide}
              total={slides.length}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key={activeSlide.id}
                transition={{ duration: 0.2 }}
              >
                <SlidePreview
                  index={activeIndex}
                  outlineTitle={outline.title}
                  slide={activeSlide}
                  total={slides.length}
                />
              </motion.div>
            </AnimatePresence>
          )
        ) : null}
      </div>
    </div>
  );
}

type SlidePreviewProps = {
  slide: ParsedSlide;
  index: number;
  total: number;
  outlineTitle: string;
};

function SlidePreview({ slide, index, total, outlineTitle }: SlidePreviewProps) {
  return (
    <article className="flex h-full min-h-[18rem] flex-col rounded-2xl border border-black/[0.06] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-premium dark:border-white/10 dark:from-zinc-100 dark:via-white dark:to-zinc-200 dark:text-zinc-950 dark:shadow-premium-dark sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400/90 dark:text-zinc-500">
        {outlineTitle} · {index + 1}/{total}
      </p>
      <h3 className="mt-4 text-balance text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
        {slide.title}
      </h3>
      <ul className="mt-6 space-y-2.5">
        {slide.bullets.length ? (
          slide.bullets.map((bullet) => (
            <li
              className="flex gap-2 text-sm leading-relaxed text-zinc-200 dark:text-zinc-700"
              key={bullet}
            >
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
              />
              <span>{bullet}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-zinc-400 dark:text-zinc-600">
            Add bullet points in Study to enrich this slide.
          </li>
        )}
      </ul>
    </article>
  );
}
