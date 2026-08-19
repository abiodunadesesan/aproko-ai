import { Skeleton } from '@/components/ui/skeleton';

export function SearchSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.400/8),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.500/6),transparent_58%)]"
      />
      <div className="relative space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-full sm:w-28" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-8 w-16 rounded-full" key={index} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55 sm:p-8">
          <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
          <Skeleton className="mx-auto mt-4 h-4 w-40" />
          <Skeleton className="mx-auto mt-2 h-3 w-64 max-w-full" />
        </div>
      </div>
    </section>
  );
}
