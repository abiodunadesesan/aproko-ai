import { TableSkeleton } from '@/components/app/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function TranscriptsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
            key={index}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-9 w-12" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full max-w-xl rounded-md" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-3 w-64" />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <div className="mt-6">
          <TableSkeleton rows={5} />
        </div>
      </div>
    </section>
  );
}
