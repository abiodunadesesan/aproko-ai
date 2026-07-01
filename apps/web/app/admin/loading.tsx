import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { AdminSkeleton } from '@/components/app/admin-skeleton';

export default function AdminLoading() {
  return (
    <AppLoadingShell pageId="admin">
      <AdminSkeleton />
    </AppLoadingShell>
  );
}
