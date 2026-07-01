import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { LibrarySkeleton } from '@/components/app/library-skeleton';

export default function LibraryLoading() {
  return (
    <AppLoadingShell pageId="library">
      <LibrarySkeleton />
    </AppLoadingShell>
  );
}
