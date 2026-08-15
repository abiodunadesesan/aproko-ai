import { Skeleton } from '@/components/ui/skeleton';

export function ResearchSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.amber.400/10),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.amber.500/7),transparent_58%)]"
      />
      <div className="relative space-y-5 sm:space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55"
            key={index}
          >
            <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
              <Skeleton className="h-5 w-44" />
              {index === 0 ? <Skeleton className="mt-2 h-3 w-56" /> : null}
            </div>
            <div className="p-4 sm:p-5">
              {index === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_auto]">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-full lg:w-24" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_1fr]">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
