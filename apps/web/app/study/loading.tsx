import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { StudySkeleton } from '@/components/app/study-skeleton';

export default function StudyLoading() {
  return (
    <AppLoadingShell pageId="study">
      <StudySkeleton />
    </AppLoadingShell>
  );
}
