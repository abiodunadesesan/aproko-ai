import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { BillingSkeleton } from '@/components/app/billing-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function BillingLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.billing}>
      <BillingSkeleton />
    </AppLoadingShell>
  );
}
