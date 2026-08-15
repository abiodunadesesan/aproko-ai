import { TableSkeleton } from '@/components/app/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function TranscriptsSkeleton() {
  return (
    <section className="relative space-y-5 sm:space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-44 bg-[radial-gradient(ellipse_at_top,theme(colors.amber.400/10),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.amber.500/7),transparent_58%)]"
      />
      <div className="relative space-y-5 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5"
              key={index}
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-8 w-12 sm:h-9" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55">
          <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800/80">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
              <Skeleton className="h-10 w-full rounded-full sm:w-28" />
            </div>
            <Skeleton className="h-10 w-full rounded-full sm:w-44" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55">
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-zinc-800/80">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full max-w-xs rounded-xl" />
          </div>
          <div className="p-4 sm:p-5">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    </section>
  );
}
