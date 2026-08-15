'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SidebarUpgradeCard() {
  return (
    <div className="mx-1 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-zinc-50 p-3 dark:border-amber-500/20 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-amber-300 dark:bg-amber-100 dark:text-zinc-900">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Upgrade to Pro</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
            Unlimited AI, memory, and study tools.
          </p>
        </div>
      </div>
      <Button
        asChild
        className="mt-3 h-8 w-full rounded-full bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        size="sm"
      >
        <Link href="/billing">View plans</Link>
      </Button>
    </div>
  );
}
