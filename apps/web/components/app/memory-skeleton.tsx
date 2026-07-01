import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function MemorySkeleton() {
  return (
    <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-40" />
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-3 w-64" />
        <div className="mt-6">
          <ListRowsSkeleton rows={5} />
        </div>
      </div>
    </section>
  );
}
