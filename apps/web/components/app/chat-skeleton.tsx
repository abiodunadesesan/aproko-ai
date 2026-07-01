import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="mt-3 h-9 w-full rounded-md" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="h-14 w-full rounded-lg" key={index} />
          ))}
        </div>
      </div>

      <div className="flex min-h-[520px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950/40">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="mt-3 h-4 w-48" />
            <Skeleton className="mt-4 h-3 w-72 max-w-full" />
          </div>
          <div className="mt-4 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <Skeleton className="h-24 w-full rounded-md" />
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-8 w-56 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
