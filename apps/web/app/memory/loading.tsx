import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { MemorySkeleton } from '@/components/app/memory-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function MemoryLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.memory}>
      <MemorySkeleton />
    </AppLoadingShell>
  );
}
