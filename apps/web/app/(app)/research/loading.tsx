import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { ResearchSkeleton } from '@/components/app/research-skeleton';

export default function ResearchLoading() {
  return (
    <AppLoadingShell pageId="research">
      <ResearchSkeleton />
    </AppLoadingShell>
  );
}
