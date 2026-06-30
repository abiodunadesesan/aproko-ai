'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { LandingNav } from '@/components/landing/landing-nav';

type AuthShellProps = {
  mode: 'sign-in' | 'sign-up';
  title: string;
  subtitle: string;
  children: ReactNode;
};

const points = [
  'Organize knowledge with projects and folders',
  'Chat with citations and memory context',
  'Generate notes, flashcards, and quizzes',
];

export function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.zinc.700/15),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,theme(colors.zinc.800/20),transparent_55%)]" />

      <LandingNav />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between gap-6 px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
        <section className="grid flex-1 items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="flex flex-col gap-5">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Welcome
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
                {subtitle}
              </p>
            </motion.div>

            <motion.ul
              animate="visible"
              className="hidden space-y-2 sm:block lg:hidden"
              initial="hidden"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {points.map((point) => (
                <motion.li
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300"
                  key={point}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  {point}
                </motion.li>
              ))}
            </motion.ul>

            <div className="hidden lg:block">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Preview your workspace
              </p>
              <DashboardPreview compact showAnimation />
            </div>
          </div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-center lg:items-center"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-full max-w-md min-w-0 overflow-x-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 sm:p-4">
              {children}
            </div>
          </motion.div>
        </section>

        <motion.p
          animate={{ opacity: 1 }}
          className="text-center text-xs leading-relaxed text-zinc-400"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {mode === 'sign-in' ? 'New to Aproko AI? ' : 'Already have an account? '}
          <Link
            className="font-medium text-zinc-100 underline underline-offset-4 transition-colors hover:text-zinc-300"
            href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}
          >
            {mode === 'sign-in' ? 'Create account' : 'Sign in'}
          </Link>
        </motion.p>
      </div>
    </main>
  );
}
