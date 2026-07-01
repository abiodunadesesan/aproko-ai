import Link from 'next/link';
import { cn } from '@/lib/utils';

type AprokoLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md';
};

/** Single-stroke script mark — FasterFlow-style flowing letterform */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('block shrink-0 text-zinc-900 dark:text-zinc-100', className)}
      fill="none"
      viewBox="0 0 17 19"
    >
      {/* Flowing A — brush stroke legs + soft crossbar */}
      <path
        d="M4.2 17.8C3.8 13.5 5.2 6.8 9.2 3.2C13.2 6.8 14.6 13.5 14.2 17.8C14.5 18.4 15.1 18.6 15.6 18.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <path
        d="M6 11.8C7.8 11.2 10.6 11.2 12.4 11.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

const sizeStyles = {
  sm: {
    root: 'text-sm',
    mark: 'h-[0.92em] w-[0.62em]',
    word: 'font-medium tracking-[-0.02em]',
    gap: 'gap-[0.15em]',
  },
  md: {
    root: 'text-[15px]',
    mark: 'h-[0.94em] w-[0.64em]',
    word: 'font-medium tracking-[-0.025em]',
    gap: 'gap-[0.18em]',
  },
} as const;

export function AprokoLogo({ className, showWordmark = true, size = 'md' }: AprokoLogoProps) {
  const styles = sizeStyles[size];

  return (
    <Link
      aria-label="Aproko home"
      className={cn(
        'group inline-flex select-none items-center transition-opacity hover:opacity-90',
        styles.root,
        styles.gap,
        className,
      )}
      href="/"
    >
      <LogoMark className={cn('relative -top-px shrink-0', styles.mark)} />
      {showWordmark ? (
        <span className={cn('leading-none text-zinc-900 dark:text-zinc-100', styles.word)}>
          proko
        </span>
      ) : null}
    </Link>
  );
}
