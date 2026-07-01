import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { appPageMeta } from '@/lib/navigation/app-pages';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibrarySourceLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.librarySource}>
      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </div>
      </section>
    </AppLoadingShell>
  );
}
