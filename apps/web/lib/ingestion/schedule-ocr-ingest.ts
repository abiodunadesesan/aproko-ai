import { processQueuedOcrJobs } from '@/lib/ingestion/process-ocr-job';
import { queueIngestJob } from '@/lib/storage/ingest-jobs';

export async function queueOcrIngestJob(input: {
  workspaceId: string;
  sourceStoragePath: string;
}): Promise<boolean> {
  const job = await queueIngestJob({
    workspaceId: input.workspaceId,
    sourceStoragePath: input.sourceStoragePath,
    jobType: 'ocr',
  });

  return Boolean(job);
}

export async function runQueuedOcrIngestJobs(limit = 1): Promise<number> {
  return processQueuedOcrJobs(limit);
}
