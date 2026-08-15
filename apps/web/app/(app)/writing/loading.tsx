import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { WritingSkeleton } from '@/components/app/writing-skeleton';

export default function WritingLoading() {
  return (
    <AppLoadingShell pageId="writing">
      <WritingSkeleton />
    </AppLoadingShell>
  );
}
