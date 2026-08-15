import { ingestLibrarySource } from '@/lib/ingestion/ingest-source';
import { runQueuedOcrIngestJobs } from '@/lib/ingestion/schedule-ocr-ingest';
import type { LibrarySource } from '@/lib/storage/library';

export async function runAsyncSourceIngest(source: LibrarySource): Promise<void> {
  try {
    await ingestLibrarySource(source, { force: false, allowLarge: true });
    await runQueuedOcrIngestJobs(1);
  } catch (error) {
    console.warn('Async source ingestion failed.', error);
  }
}
