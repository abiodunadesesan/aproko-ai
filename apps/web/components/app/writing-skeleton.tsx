import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function WritingSkeleton() {
  return (
    <AppPageFrame>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
        <AppPanel className="hidden lg:block">
          <AppPanelHeader title="Drafts" />
          <AppPanelBody>
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="mt-3 h-9 w-full rounded-xl" />
            <div className="mt-4">
              <ListRowsSkeleton rowHeightClassName="h-14" rows={5} />
            </div>
          </AppPanelBody>
        </AppPanel>

        <div className="min-w-0 space-y-4">
          <AppPanel>
            <AppPanelHeader title="Writing tools" />
            <AppPanelBody className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton className="h-9 w-24 rounded-full" key={index} />
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-xl lg:hidden" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-56 w-full rounded-xl" />
                <Skeleton className="h-56 w-full rounded-xl" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Skeleton className="h-10 w-full rounded-full sm:w-32" />
                <Skeleton className="h-10 w-full rounded-full sm:w-36" />
              </div>
            </AppPanelBody>
          </AppPanel>

          <AppPanel muted>
            <AppPanelHeader title="Transparency check" />
            <AppPanelBody>
              <Skeleton className="h-20 w-full rounded-xl" />
            </AppPanelBody>
          </AppPanel>
        </div>
      </div>
    </AppPageFrame>
  );
}
