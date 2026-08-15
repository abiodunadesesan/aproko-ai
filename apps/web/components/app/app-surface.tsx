import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Premium shared surfaces — glass panels, hairline borders, amber glow. */
export const appSurface = {
  page: 'relative space-y-6 sm:space-y-7',
  atmosphere: 'pointer-events-none absolute inset-x-0 -top-10 h-72 aproko-mesh opacity-90',
  panel: 'aproko-panel overflow-hidden',
  panelMuted:
    'rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.02]',
  inset:
    'rounded-xl border border-black/[0.04] bg-black/[0.025] dark:border-white/[0.06] dark:bg-white/[0.03]',
  field:
    'h-11 w-full rounded-xl border border-black/[0.08] bg-white/90 px-3.5 text-sm text-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus-visible:border-amber-400/40 dark:focus-visible:ring-amber-400/15',
  label: 'text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400',
  chip: 'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30',
  chipActive:
    'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900',
  chipIdle:
    'border-black/[0.08] bg-white/70 text-zinc-600 hover:border-black/15 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06]',
  linkRow:
    'block rounded-xl border border-black/[0.06] bg-white/70 p-4 shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-amber-500/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-amber-400/25 dark:hover:bg-white/[0.05]',
  alert:
    'rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3.5 text-sm text-red-700 dark:text-red-300',
  notice:
    'rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-3.5 text-sm text-amber-900 dark:text-amber-100',
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
      <div className="relative space-y-6 sm:space-y-7">{children}</div>
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
        'flex flex-col gap-3 border-b border-black/[0.05] px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5 dark:border-white/[0.06]',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
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
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
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
    <label className={cn(appSurface.label, 'mb-1.5 block', className)} htmlFor={htmlFor}>
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
