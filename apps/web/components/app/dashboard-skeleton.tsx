import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56 sm:w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-full sm:w-36" />
          <Skeleton className="h-11 w-full rounded-full sm:w-36" />
          <Skeleton className="h-11 w-full rounded-full sm:w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5"
            key={index}
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-14 sm:h-9" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.9fr)] lg:gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-52" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-4 w-40" />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton className="h-[4.5rem] w-full rounded-xl" key={index} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            <Skeleton className="mt-2 h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
