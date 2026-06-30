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
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.indigo.500/15),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between gap-6 rounded-2xl border bg-card/70 p-4 backdrop-blur md:p-6">
        <header className="flex items-center justify-between">
          <Link className="text-sm font-semibold tracking-tight" href="/">
            Aproko AI
          </Link>
          <Badge variant="secondary">AI Knowledge OS</Badge>
        </header>

        <section className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-muted/30 p-4 lg:hidden"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Welcome</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="hidden rounded-xl border bg-muted/40 p-6 lg:block"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">{title}</h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">{subtitle}</p>

            <Separator className="my-6" />

            <div className="space-y-3">
              {points.map((point) => (
                <Card className="bg-background/70" key={point}>
                  <CardContent className="px-4 py-3 text-sm">{point}</CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center rounded-xl border bg-background/80 p-3 sm:p-4 md:p-6"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
          >
            <div className="w-full max-w-md overflow-x-hidden">{children}</div>
          </motion.div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          {mode === 'sign-in' ? 'New to Aproko AI? ' : 'Already have an account? '}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}
          >
            {mode === 'sign-in' ? 'Create account' : 'Sign in'}
          </Link>
        </p>
      </div>
    </main>
  );
}
