import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.amber.400/10),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.amber.500/7),transparent_58%)]"
      />
      <div className="relative space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55">
          <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-20 w-full rounded-xl" key={index} />
            ))}
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55"
            key={index}
          >
            <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
