import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function MemorySkeleton() {
  return (
    <AppPageFrame>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
        <AppPanel className="order-1">
          <AppPanelHeader title="Capture Memory" />
          <AppPanelBody>
            <div className="space-y-3.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </AppPanelBody>
        </AppPanel>

        <AppPanel className="order-2 min-w-0" muted>
          <AppPanelHeader title="Memory Timeline" />
          <AppPanelBody>
            <ListRowsSkeleton rows={5} />
          </AppPanelBody>
        </AppPanel>
      </div>
    </AppPageFrame>
  );
}
