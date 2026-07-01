import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function StudySkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
        <Skeleton className="mt-4 h-10 w-full rounded-md" />
        <Skeleton className="mt-3 h-9 w-28 rounded-md" />
        <div className="mt-4">
          <ListRowsSkeleton rowHeightClassName="h-14" rows={4} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="mt-3 h-56 w-full rounded-md" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60"
            key={index}
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-36" />
            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-md" />
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
