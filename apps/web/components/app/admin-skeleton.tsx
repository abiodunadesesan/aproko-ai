import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 grid gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-16 w-full rounded-md" key={index} />
          ))}
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60"
          key={index}
        >
          <Skeleton className="h-5 w-24" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </div>
      ))}
    </section>
  );
}
