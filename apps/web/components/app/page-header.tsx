import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-5', className)}>
      <div className="flex min-w-0 items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-gradient-to-br from-zinc-900 to-zinc-700 text-amber-300 shadow-premium dark:border-white/10 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900 dark:shadow-premium-dark">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-50 sm:text-[1.75rem]">
              {title}
            </h2>
            {badge ? (
              <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-amber-800 dark:text-amber-200">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
