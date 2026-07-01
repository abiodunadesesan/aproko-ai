import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { DashboardSkeleton } from '@/components/app/dashboard-skeleton';

export default function DashboardLoading() {
  return (
    <AppLoadingShell pageId="dashboard">
      <DashboardSkeleton />
    </AppLoadingShell>
  );
}
