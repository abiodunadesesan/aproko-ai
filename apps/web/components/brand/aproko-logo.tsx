import Link from 'next/link';
import { cn } from '@/lib/utils';

type AprokoLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md';
};

export function AprokoLogo({ className, showWordmark = true, size = 'md' }: AprokoLogoProps) {
  const iconSize = size === 'sm' ? 28 : 32;

  return (
    <Link
      aria-label="Aproko AI home"
      className={cn('group inline-flex items-center gap-2.5', className)}
      href="/"
    >
      <span
        aria-hidden="true"
        className="relative inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-300/80 bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/20 dark:border-zinc-700 dark:from-amber-500 dark:to-orange-600"
        style={{ height: iconSize, width: iconSize }}
      >
        <svg className="h-[55%] w-[55%] text-zinc-950" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 17L12 5l5 12M9.5 13h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-base">
            Aproko
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 sm:text-[11px]">
            AI
          </span>
        </span>
      ) : null}
    </Link>
  );
}
