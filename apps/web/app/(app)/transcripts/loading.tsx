import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { TranscriptsSkeleton } from '@/components/app/transcripts-skeleton';

export default function TranscriptsLoading() {
  return (
    <AppLoadingShell pageId="transcripts">
      <TranscriptsSkeleton />
    </AppLoadingShell>
  );
}
