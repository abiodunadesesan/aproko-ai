import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-24" />
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-full max-w-sm rounded-md" />
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </section>
  );
}
