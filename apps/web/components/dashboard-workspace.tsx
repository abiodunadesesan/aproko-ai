'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Layers,
  MessageSquare,
  Presentation,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { AppPanel, AppPanelBody, AppPanelHeader } from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DashboardWorkspaceTab =
  | 'overview'
  | 'chat'
  | 'flashcards'
  | 'quizzes'
  | 'presentations';

const TAB_ITEMS: {
  id: DashboardWorkspaceTab;
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quizzes', label: 'Quizzes', icon: ScrollText },
  { id: 'presentations', label: 'Presentations', icon: Presentation },
];

const tabMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

type WorkspaceHubPanelProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  highlights: string[];
};

function WorkspaceHubPanel({ title, description, href, cta, highlights }: WorkspaceHubPanelProps) {
  return (
    <AppPanel>
      <AppPanelHeader description={description} title={title} />
      <AppPanelBody className="space-y-4 pt-0 sm:pt-0">
        <ul className="space-y-2">
          {highlights.map((item) => (
            <li
              className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3.5 py-2.5 text-sm text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-300"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
        <Button asChild className="rounded-full">
          <Link href={href}>
            {cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </AppPanelBody>
    </AppPanel>
  );
}

type DashboardWorkspaceProps = {
  overview: ReactNode;
  chatSessionCount: number;
  studyItemCount: number;
};

function hubPanelsForTab(
  tab: DashboardWorkspaceTab,
  chatSessionCount: number,
  studyItemCount: number,
): WorkspaceHubPanelProps | null {
  switch (tab) {
    case 'chat':
      return {
        title: 'Grounded chat',
        description: 'Ask questions with citations from your library, memory, and transcripts.',
        href: '/chat',
        cta: 'Open chat workspace',
        highlights: [
          chatSessionCount > 0
            ? `${chatSessionCount} active session${chatSessionCount === 1 ? '' : 's'} in this workspace`
            : 'Start your first grounded conversation',
          'Voice input and multi-model switching',
          'Retrieval-backed answers with source citations',
        ],
      };
    case 'flashcards':
      return {
        title: 'Flashcard decks',
        description: 'Generate spaced-repetition decks from notes and transcript sources.',
        href: '/study',
        cta: 'Open study workspace',
        highlights: [
          studyItemCount > 0
            ? `${studyItemCount} study output${studyItemCount === 1 ? '' : 's'} already in workspace`
            : 'Generate your first deck from a note or transcript',
          'LLM-backed question and answer pairs',
          'Flip cards inline during review sessions',
        ],
      };
    case 'quizzes':
      return {
        title: 'Quiz simulator',
        description: 'Practice with auto-generated quizzes from your uploaded knowledge.',
        href: '/study',
        cta: 'Build a quiz',
        highlights: [
          'Multiple-choice quizzes from notes or transcripts',
          'Track attempts and review missed concepts',
          'Pair with flashcards for active recall',
        ],
      };
    case 'presentations':
      return {
        title: 'Presentation outlines',
        description: 'Turn study material into slide-ready outlines for lectures and demos.',
        href: '/study',
        cta: 'Generate slide outline',
        highlights: [
          'Structured slide titles and bullet points',
          'Export-friendly outline format',
          'Built from the same sources as flashcards and quizzes',
        ],
      };
    default:
      return null;
  }
}

export function DashboardWorkspace({
  overview,
  chatSessionCount,
  studyItemCount,
}: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<DashboardWorkspaceTab>('overview');
  const reduceMotion = useReducedMotion();
  const hub = hubPanelsForTab(activeTab, chatSessionCount, studyItemCount);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        className="flex gap-1.5 overflow-x-auto rounded-full border border-black/[0.06] bg-white/70 p-1 shadow-premium backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-premium-dark"
        role="tablist"
        aria-label="Dashboard workspace"
      >
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              aria-selected={selected}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold tracking-tight transition-colors sm:px-4 sm:text-sm',
                selected
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100',
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {reduceMotion ? (
        <div>{activeTab === 'overview' ? overview : hub ? <WorkspaceHubPanel {...hub} /> : null}</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            animate={tabMotion.animate}
            exit={tabMotion.exit}
            initial={tabMotion.initial}
            key={activeTab}
            transition={tabMotion.transition}
          >
            {activeTab === 'overview' ? overview : hub ? <WorkspaceHubPanel {...hub} /> : null}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
