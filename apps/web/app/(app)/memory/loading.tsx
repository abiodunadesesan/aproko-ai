import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { MemorySkeleton } from '@/components/app/memory-skeleton';

export default function MemoryLoading() {
  return (
    <AppLoadingShell pageId="memory">
      <MemorySkeleton />
    </AppLoadingShell>
  );
}
