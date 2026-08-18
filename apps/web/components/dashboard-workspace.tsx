'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Layers,
  MessageSquare,
  Presentation,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import {
  DashboardChatPanel,
  DashboardFlashcardsPanel,
  DashboardPresentationsPanel,
  DashboardQuizzesPanel,
} from '@/components/dashboard/dashboard-workspace-panels';
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

type DashboardWorkspaceProps = {
  overview: ReactNode;
};

function renderWorkspaceTab(tab: DashboardWorkspaceTab) {
  switch (tab) {
    case 'chat':
      return <DashboardChatPanel />;
    case 'flashcards':
      return <DashboardFlashcardsPanel />;
    case 'quizzes':
      return <DashboardQuizzesPanel />;
    case 'presentations':
      return <DashboardPresentationsPanel />;
    default:
      return null;
  }
}

export function DashboardWorkspace({ overview }: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<DashboardWorkspaceTab>('overview');
  const reduceMotion = useReducedMotion();

  const tabContent = activeTab === 'overview' ? overview : renderWorkspaceTab(activeTab);

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
        <div>{tabContent}</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            animate={tabMotion.animate}
            exit={tabMotion.exit}
            initial={tabMotion.initial}
            key={activeTab}
            transition={tabMotion.transition}
          >
            {tabContent}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
