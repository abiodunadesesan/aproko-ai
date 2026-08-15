'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SidebarUpgradeCard() {
  return (
    <div className="relative mx-1 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] via-white/80 to-transparent p-3.5 dark:via-white/[0.04]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"
      />
      <div className="relative flex items-start gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-amber-300 shadow-sm dark:bg-amber-100 dark:text-zinc-900">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Upgrade to Pro
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
            Unlimited AI, memory, and study tools.
          </p>
        </div>
      </div>
      <Button
        asChild
        className="relative mt-3.5 h-8 w-full rounded-full bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        size="sm"
      >
        <Link href="/billing">View plans</Link>
      </Button>
    </div>
  );
}
