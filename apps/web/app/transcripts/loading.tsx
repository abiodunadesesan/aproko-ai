import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { TranscriptsSkeleton } from '@/components/app/transcripts-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function TranscriptsLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.transcripts}>
      <TranscriptsSkeleton />
    </AppLoadingShell>
  );
}
