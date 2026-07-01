import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { BillingSkeleton } from '@/components/app/billing-skeleton';

export default function BillingLoading() {
  return (
    <AppLoadingShell pageId="billing">
      <BillingSkeleton />
    </AppLoadingShell>
  );
}
