import { chunkText, estimateTokenCount } from '@/lib/ingestion/chunk-text';
import { updateSourceIngestStatus } from '@/lib/ingestion/ingest-source';
import {
  deleteChunkEmbeddingsForSource,
  embedSourceChunks,
} from '@/lib/retrieval/embed-source-chunks';
import { getLibraryBucketName } from '@/lib/storage/library';
import {
  claimNextIngestJob,
  completeIngestJob,
  failIngestJob,
  requeueIngestJob,
  type IngestJob,
} from '@/lib/storage/ingest-jobs';
import {
  deleteSourceChunks,
  listSourceChunks,
  replaceSourceChunks,
} from '@/lib/storage/source-chunks';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_OCR_ATTEMPTS = 3;

type OcrExtractResponse = {
  text?: string;
  error?: string;
};

function inferMimeTypeFromPath(objectPath: string): string | null {
  const ext = objectPath.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'tif' || ext === 'tiff') return 'image/tiff';
  if (ext === 'bmp') return 'image/bmp';
  return null;
}

function sourceTypeFromMime(mimeType: string | null): 'pdf' | 'image' {
  return mimeType?.startsWith('image/') ? 'image' : 'pdf';
}

async function createSignedSourceUrl(objectPath: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const signed = await supabase.storage
    .from(getLibraryBucketName())
    .createSignedUrl(objectPath, 60 * 15);

  if (signed.error || !signed.data?.signedUrl) {
    console.warn('Unable to create signed URL for OCR job.', signed.error?.message);
    return null;
  }

  return signed.data.signedUrl;
}

async function extractTextViaOcrWorker(signedUrl: string, mimeType: string | null): Promise<string> {
  const workerUrl = process.env.OCR_WORKER_URL?.trim()?.replace(/\/$/, '');
  if (!workerUrl) {
    throw new Error('ocr_worker_not_configured');
  }

  const workerSecret = process.env.OCR_WORKER_SECRET?.trim();
  const response = await fetch(`${workerUrl}/extract`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(workerSecret ? { authorization: `Bearer ${workerSecret}` } : {}),
    },
    body: JSON.stringify({
      fileUrl: signedUrl,
      ...(mimeType ? { mimeType } : {}),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as OcrExtractResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? `ocr_worker_failed_${response.status}`);
  }

  const text = payload.text?.trim() ?? '';
  if (!text) {
    throw new Error('ocr_empty_document');
  }

  return text;
}

async function persistOcrText(
  workspaceId: string,
  objectPath: string,
  extracted: string,
  mimeType: string | null,
): Promise<number> {
  await deleteChunkEmbeddingsForSource(workspaceId, objectPath);
  await deleteSourceChunks(workspaceId, objectPath);

  const chunks = chunkText(extracted);
  const persisted = await replaceSourceChunks(
    workspaceId,
    objectPath,
    chunks.map((content) => ({
      content,
      tokenCount: estimateTokenCount(content),
      metadata: { sourceType: sourceTypeFromMime(mimeType), extraction: 'ocr' },
    })),
  );

  if (persisted === 0) {
    throw new Error('persist_failed');
  }

  const storedChunks = await listSourceChunks(workspaceId, objectPath);
  await embedSourceChunks({
    workspaceId,
    sourceStoragePath: objectPath,
    chunks: storedChunks,
  });

  return persisted;
}

export async function processIngestJob(job: IngestJob): Promise<'completed' | 'failed' | 'requeued'> {
  if (job.jobType !== 'ocr') {
    await failIngestJob(job.id, `unsupported_job_type:${job.jobType}`);
    return 'failed';
  }

  try {
    const signedUrl = await createSignedSourceUrl(job.sourceStoragePath);
    if (!signedUrl) {
      throw new Error('signed_url_failed');
    }

    const mimeType = inferMimeTypeFromPath(job.sourceStoragePath);
    const extracted = await extractTextViaOcrWorker(signedUrl, mimeType);
    await persistOcrText(job.workspaceId, job.sourceStoragePath, extracted, mimeType);
    await updateSourceIngestStatus(job.workspaceId, job.sourceStoragePath, 'ready');
    await completeIngestJob(job.id);
    return 'completed';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'ocr_failed';
    if (reason === 'ocr_worker_not_configured' && job.attempts < MAX_OCR_ATTEMPTS) {
      await requeueIngestJob(job.id, reason);
      return 'requeued';
    }

    if (job.attempts < MAX_OCR_ATTEMPTS && reason.startsWith('ocr_worker_failed')) {
      await requeueIngestJob(job.id, reason);
      return 'requeued';
    }

    await updateSourceIngestStatus(job.workspaceId, job.sourceStoragePath, 'failed');
    await failIngestJob(job.id, reason);
    return 'failed';
  }
}

export async function processQueuedOcrJobs(limit = 1): Promise<number> {
  let processed = 0;

  for (let index = 0; index < limit; index += 1) {
    const job = await claimNextIngestJob('ocr');
    if (!job) {
      break;
    }

    await processIngestJob(job);
    processed += 1;
  }

  return processed;
}
