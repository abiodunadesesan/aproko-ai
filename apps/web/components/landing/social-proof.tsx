'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/landing/fade-in';
import { useLandingLocale } from '@/components/landing/locale-provider';

const momentStyles = [
  {
    accent: 'from-amber-400/35 via-orange-500/20 to-zinc-900/70',
    ring: 'ring-amber-400/30',
  },
  {
    accent: 'from-sky-400/35 via-cyan-500/15 to-zinc-900/70',
    ring: 'ring-sky-400/30',
  },
  {
    accent: 'from-rose-400/30 via-orange-400/15 to-zinc-900/70',
    ring: 'ring-rose-400/30',
  },
  {
    accent: 'from-orange-400/30 via-amber-500/20 to-zinc-900/70',
    ring: 'ring-orange-400/30',
  },
  {
    accent: 'from-teal-400/25 via-sky-500/15 to-zinc-900/70',
    ring: 'ring-teal-400/30',
  },
] as const;

type MomentCardProps = {
  handle: string;
  label: string;
  quote: string;
  initials: string;
  accent: string;
  ring: string;
  demoLabel: string;
  viewLabel: string;
};

function MomentCard({
  handle,
  label,
  quote,
  initials,
  accent,
  ring,
  demoLabel,
  viewLabel,
}: MomentCardProps) {
  return (
    <Card className="h-full w-[280px] shrink-0 overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:w-[300px]">
      <div className={`h-28 bg-gradient-to-br ${accent} sm:h-32`}>
        <div className="flex h-full items-center justify-center">
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-zinc-950/70 text-sm font-semibold text-zinc-100 ring-2 ${ring}`}
          >
            {initials}
          </span>
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">@{handle}</p>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{label}</p>
          </div>
          <Button
            aria-label={`View ${handle} profile`}
            className="h-7 shrink-0 rounded-full border-zinc-300 px-2.5 text-[11px] text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
            size="sm"
            type="button"
            variant="outline"
          >
            {viewLabel}
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <Play className="h-3 w-3 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <span>{demoLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialProof() {
  const { t } = useLandingLocale();
  const moments = t.social.moments.map((moment, idx) => ({
    ...moment,
    ...momentStyles[idx % momentStyles.length]!,
  }));
  const track = [...moments, ...moments];

  return (
    <section className="mt-16 sm:mt-20">
      <FadeIn>
        <h2 className="text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
          {t.social.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
          {t.social.subtitle}
        </p>
      </FadeIn>

      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950" />

        <div className="landing-marquee flex w-max gap-4 py-1">
          {track.map((moment, idx) => (
            <MomentCard
              accent={moment.accent}
              demoLabel={t.social.demo}
              handle={moment.handle}
              initials={moment.initials}
              key={`${moment.handle}-${idx}`}
              label={moment.label}
              quote={moment.quote}
              ring={moment.ring}
              viewLabel={t.social.view}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
