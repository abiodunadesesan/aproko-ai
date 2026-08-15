import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared surface classes for app pages (zinc + amber accent). */
export const appSurface = {
  page: 'relative space-y-5 sm:space-y-6',
  atmosphere:
    'pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.amber.400/10),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.amber.500/7),transparent_58%)]',
  panel:
    'rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] duration-200 hover:border-zinc-300/90 dark:border-zinc-800 dark:bg-zinc-900/55 dark:hover:border-zinc-700',
  panelMuted:
    'rounded-2xl border border-zinc-200/80 bg-zinc-50/70 transition-[border-color] duration-200 dark:border-zinc-800 dark:bg-zinc-950/35',
  inset:
    'rounded-xl border border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/40',
  field:
    'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-700',
  label: 'text-xs font-medium text-zinc-500 dark:text-zinc-400',
  chip: 'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600',
  chipActive:
    'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900',
  chipIdle:
    'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
  linkRow:
    'block rounded-xl border border-zinc-200 bg-white p-3.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-600',
  alert:
    'rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive',
  notice:
    'rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200',
} as const;

type AppPageFrameProps = {
  children: ReactNode;
  className?: string;
  withAtmosphere?: boolean;
};

export function AppPageFrame({
  children,
  className,
  withAtmosphere = true,
}: AppPageFrameProps) {
  return (
    <section className={cn(appSurface.page, className)}>
      {withAtmosphere ? <div aria-hidden className={appSurface.atmosphere} /> : null}
      <div className="relative space-y-5 sm:space-y-6">{children}</div>
    </section>
  );
}

type AppPanelProps = {
  children: ReactNode;
  className?: string;
  muted?: boolean;
};

export function AppPanel({ children, className, muted = false }: AppPanelProps) {
  return (
    <div className={cn(muted ? appSurface.panelMuted : appSurface.panel, className)}>
      {children}
    </div>
  );
}

type AppPanelHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function AppPanelHeader({ title, description, action, className }: AppPanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 dark:border-zinc-800/80',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AppPanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>;
}

export function AppFieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label className={cn(appSurface.label, 'block', className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function AppFilterChip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        appSurface.chip,
        active ? appSurface.chipActive : appSurface.chipIdle,
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
