import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { AdminSkeleton } from '@/components/app/admin-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function AdminLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.admin}>
      <AdminSkeleton />
    </AppLoadingShell>
  );
}
