import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { TableSkeleton } from '@/components/app/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function LibrarySkeleton() {
  return (
    <AppPageFrame>
      <AppPanel>
        <AppPanelHeader title="Upload and taxonomy" />
        <AppPanelBody>
          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="h-9 w-28 rounded-xl" key={index} />
            ))}
          </div>
        </AppPanelBody>
      </AppPanel>

      <AppPanel>
        <AppPanelHeader title="Sources" />
        <AppPanelBody>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <TableSkeleton rows={6} />
        </AppPanelBody>
      </AppPanel>
    </AppPageFrame>
  );
}
