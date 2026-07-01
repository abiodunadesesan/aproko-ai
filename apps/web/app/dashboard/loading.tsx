import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { DashboardSkeleton } from '@/components/app/dashboard-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function DashboardLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.dashboard}>
      <DashboardSkeleton />
    </AppLoadingShell>
  );
}
