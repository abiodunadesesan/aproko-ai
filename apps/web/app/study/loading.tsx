import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { StudySkeleton } from '@/components/app/study-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function StudyLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.study}>
      <StudySkeleton />
    </AppLoadingShell>
  );
}
