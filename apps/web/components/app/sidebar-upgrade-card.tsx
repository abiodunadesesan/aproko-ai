'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SidebarUpgradeCard() {
  return (
    <div className="mx-2 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white p-3 dark:border-amber-500/20 dark:from-amber-950/30 dark:via-zinc-900/60 dark:to-zinc-950">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upgrade to Pro</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
            Unlimited AI queries, memory timeline, and more.
          </p>
        </div>
      </div>
      <Button
        asChild
        className="mt-3 h-8 w-full rounded-full bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
        size="sm"
      >
        <Link href="/billing">Get Pro</Link>
      </Button>
    </div>
  );
}
