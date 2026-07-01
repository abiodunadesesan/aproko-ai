import { TableSkeleton } from '@/components/app/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function LibrarySkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="h-9 w-28 rounded-full" key={index} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="mt-6">
          <TableSkeleton rows={6} />
        </div>
      </div>
    </section>
  );
}
