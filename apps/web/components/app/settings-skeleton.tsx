import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.400/8),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.500/6),transparent_58%)]"
      />
      <div className="relative grid gap-5 sm:gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55"
            key={index}
          >
            <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-full sm:w-36" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
