import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { LibrarySkeleton } from '@/components/app/library-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function LibraryLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.library}>
      <LibrarySkeleton />
    </AppLoadingShell>
  );
}
