import { Skeleton } from '@/components/ui/skeleton';

export function BillingSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.400/8),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.zinc.500/6),transparent_58%)]"
      />
      <div className="relative space-y-5 sm:space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55"
              key={index}
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
              <Skeleton className="mt-6 h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55"
              key={index}
            >
              <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Skeleton className="h-10 w-full rounded-full sm:w-40" />
                  <Skeleton className="h-10 w-full rounded-full sm:w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
