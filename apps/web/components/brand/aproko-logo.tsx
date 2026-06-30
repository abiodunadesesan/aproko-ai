import Link from 'next/link';
import { cn } from '@/lib/utils';

type AprokoLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md';
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="text-white"
      fill="none"
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      <defs>
        <linearGradient id="aproko-logo-shine" x1="8" x2="24" y1="6" y2="26">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {/* Memory orbit */}
      <circle
        cx="16"
        cy="16"
        r="10.5"
        stroke="url(#aproko-logo-shine)"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      {/* Knowledge nodes + connections */}
      <circle cx="16" cy="10" fill="url(#aproko-logo-shine)" r="2.2" />
      <circle cx="10.5" cy="19" fill="url(#aproko-logo-shine)" fillOpacity="0.85" r="1.8" />
      <circle cx="21.5" cy="19" fill="url(#aproko-logo-shine)" fillOpacity="0.85" r="1.8" />
      <path
        d="M16 12.2v3.2M13.8 17.4l2.2-1.2 2.2 1.2"
        stroke="url(#aproko-logo-shine)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      {/* Core lens — AI that sees */}
      <circle cx="16" cy="16" r="3.1" stroke="url(#aproko-logo-shine)" strokeWidth="1.35" />
      <circle cx="16" cy="16" fill="url(#aproko-logo-shine)" r="1.1" />
    </svg>
  );
}

export function AprokoLogo({ className, showWordmark = false, size = 'md' }: AprokoLogoProps) {
  const boxSize = size === 'sm' ? 34 : 38;
  const markSize = size === 'sm' ? 20 : 22;

  return (
    <Link
      aria-label="Aproko AI home"
      className={cn('group inline-flex items-center gap-2.5', className)}
      href="/"
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center rounded-[11px]',
          'border border-amber-400/30 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600',
          'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(245,158,11,0.55)]',
          'transition-transform duration-200 group-hover:scale-[1.03]',
          'dark:border-amber-500/25 dark:from-amber-500 dark:via-orange-500 dark:to-orange-700',
          'dark:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.45)]',
        )}
        style={{ height: boxSize, width: boxSize }}
      >
        <LogoMark size={markSize} />
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
