import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function StudySkeleton() {
  return (
    <AppPageFrame>
      <AppPanel>
        <AppPanelHeader title="Generation source" />
        <AppPanelBody>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-full rounded-xl sm:max-w-xs" />
            <Skeleton className="h-10 w-full flex-1 rounded-xl" />
          </div>
        </AppPanelBody>
      </AppPanel>

      <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[280px_1fr] lg:items-start">
        <AppPanel>
          <AppPanelHeader title="Notes" />
          <AppPanelBody>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="mt-3 h-9 w-full rounded-xl sm:w-28" />
            <div className="mt-4">
              <ListRowsSkeleton rowHeightClassName="h-14" rows={4} />
            </div>
          </AppPanelBody>
        </AppPanel>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <AppPanel>
            <AppPanelHeader title="Note editor" />
            <AppPanelBody>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="mt-3 h-56 w-full rounded-xl" />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Skeleton className="h-9 w-full rounded-xl sm:w-24" />
                <Skeleton className="h-9 w-full rounded-xl sm:w-28" />
              </div>
            </AppPanelBody>
          </AppPanel>

          {Array.from({ length: 3 }).map((_, index) => (
            <AppPanel key={index}>
              <AppPanelHeader title={index === 0 ? 'Flashcards' : index === 1 ? 'Quiz' : 'Summaries'} />
              <AppPanelBody>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl md:w-28" />
                </div>
                <Skeleton className="mt-3 h-10 w-full rounded-xl" />
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              </AppPanelBody>
            </AppPanel>
          ))}
        </div>
      </div>
    </AppPageFrame>
  );
}
