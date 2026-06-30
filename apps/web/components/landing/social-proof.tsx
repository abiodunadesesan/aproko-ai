'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/landing/fade-in';

const moments = [
  {
    handle: 'sarah.aproko',
    label: 'Research workflow',
    quote: 'Uploaded 40 papers and asked follow-ups with citations in one session.',
    initials: 'SA',
    accent: 'from-zinc-700/40 to-zinc-900/60',
  },
  {
    handle: 'marcus.aproko',
    label: 'Study session',
    quote: 'Flashcards from my lecture notes — no manual copy-paste from generic chat.',
    initials: 'MA',
    accent: 'from-zinc-600/30 to-zinc-900/50',
  },
  {
    handle: 'team.aproko',
    label: 'Shared workspace',
    quote: 'Our team library keeps research context in one place instead of scattered docs.',
    initials: 'TA',
    accent: 'from-zinc-800/50 to-zinc-950/80',
  },
];

export function SocialProof() {
  return (
    <section className="mt-16 sm:mt-20">
      <FadeIn>
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
          Real moments from our users — see it in action
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Students and teams using Aproko AI to capture knowledge, ask grounded questions, and ship
          study outputs faster.
        </p>
      </FadeIn>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {moments.map((moment, idx) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-[260px] shrink-0 sm:min-w-0"
            initial={{ opacity: 0, y: 10 }}
            key={moment.handle}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className="h-full overflow-hidden border-zinc-800 bg-zinc-900/60">
              <div className={`h-28 bg-gradient-to-br ${moment.accent} sm:h-32`}>
                <div className="flex h-full items-center justify-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 text-sm font-medium text-zinc-200">
                    {moment.initials}
                  </span>
                </div>
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">@{moment.handle}</p>
                    <p className="text-xs text-zinc-500">{moment.label}</p>
                  </div>
                  <Button
                    aria-label={`View ${moment.handle} profile`}
                    className="h-7 shrink-0 rounded-full px-2.5 text-[11px]"
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    View
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  &ldquo;{moment.quote}&rdquo;
                </p>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Play className="h-3 w-3" aria-hidden="true" />
                  <span>Demo clip — coming soon</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
