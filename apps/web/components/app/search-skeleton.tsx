import { Skeleton } from '@/components/ui/skeleton';

export function SearchSkeleton() {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-5 grid gap-2 md:grid-cols-[1fr_auto]">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-7 w-16 rounded-full" key={index} />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
        <Skeleton className="mx-auto mt-4 h-4 w-40" />
        <Skeleton className="mx-auto mt-2 h-3 w-64" />
      </div>
    </section>
  );
}
