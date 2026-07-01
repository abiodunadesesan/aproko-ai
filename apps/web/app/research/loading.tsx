import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { ResearchSkeleton } from '@/components/app/research-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function ResearchLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.research}>
      <ResearchSkeleton />
    </AppLoadingShell>
  );
}
