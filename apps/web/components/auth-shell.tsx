'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type AuthShellProps = {
  mode: 'sign-in' | 'sign-up';
  title: string;
  subtitle: string;
  children: ReactNode;
};

const points = [
  'Organize your knowledge with projects and folders',
  'Chat with citations, memory context, and study actions',
  'Generate notes, flashcards, and quizzes in one flow',
];

export function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-3 py-6 text-zinc-100 sm:px-4 sm:py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.purple.500/20),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-black/60 p-3 backdrop-blur-xl sm:min-h-[calc(100vh-4rem)] sm:gap-6 sm:rounded-2xl sm:p-4 md:p-6">
        <header className="flex items-center justify-between gap-2 rounded-full border border-zinc-800 bg-black/60 px-3 py-2 backdrop-blur-xl sm:px-4">
          <Link className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100" href="/">
            Aproko AI
          </Link>
          <Badge
            className="hidden border-zinc-700 bg-zinc-900 text-[10px] text-zinc-200 sm:inline-flex sm:text-xs"
            variant="secondary"
          >
            AI Knowledge OS
          </Badge>
        </header>

        <section className="grid items-stretch gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-4 lg:hidden"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Welcome</p>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-zinc-100 sm:text-2xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subtitle}</p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 lg:block"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Welcome</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-100">{title}</h1>
            <p className="mt-3 max-w-lg text-sm text-zinc-400">{subtitle}</p>

            <Separator className="my-6 bg-zinc-800" />

            <div className="space-y-3">
              {points.map((point) => (
                <Card className="border-zinc-800 bg-zinc-950/70" key={point}>
                  <CardContent className="px-4 py-3 text-sm text-zinc-300">{point}</CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 sm:p-4 md:p-6"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
          >
            <div className="w-full max-w-md min-w-0 overflow-x-hidden">{children}</div>
          </motion.div>
        </section>

        <p className="px-1 text-center text-xs leading-relaxed text-zinc-400">
          {mode === 'sign-in' ? 'New to Aproko AI? ' : 'Already have an account? '}
          <Link
            className="font-medium text-zinc-100 underline underline-offset-4 transition-colors hover:text-zinc-300"
            href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}
          >
            {mode === 'sign-in' ? 'Create account' : 'Sign in'}
          </Link>
        </p>
      </div>
    </main>
  );
}
