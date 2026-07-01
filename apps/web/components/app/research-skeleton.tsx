import { Skeleton } from '@/components/ui/skeleton';

export function ResearchSkeleton() {
  return (
    <section className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60"
          key={index}
        >
          <Skeleton className="h-5 w-44" />
          {index === 0 ? (
            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          ) : (
            <div className="mt-4 grid gap-2 md:grid-cols-[280px_1fr]">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
