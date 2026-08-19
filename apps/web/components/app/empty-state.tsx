import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/[0.08] text-center dark:border-white/10',
        'bg-gradient-to-b from-white/80 to-black/[0.02] dark:from-white/[0.04] dark:to-transparent',
        compact ? 'px-5 py-10' : 'px-6 py-14',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.zinc.400/10),transparent_55%)]"
      />
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-zinc-700 shadow-premium dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 dark:shadow-premium-dark">
        <Icon className="h-6 w-6" />
      </span>
      <p className="relative mt-5 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      <p className="relative mt-1.5 max-w-sm text-pretty text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
