import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type IngestJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type IngestJobType = 'ocr';

export type IngestJob = {
  id: string;
  workspaceId: string;
  sourceStoragePath: string;
  jobType: IngestJobType;
  status: IngestJobStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbIngestJobRow = {
  id: string;
  workspace_id: string;
  source_storage_path: string;
  job_type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function toIngestJob(row: DbIngestJobRow): IngestJob {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceStoragePath: row.source_storage_path,
    jobType: row.job_type as IngestJobType,
    status: row.status as IngestJobStatus,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queueIngestJob(input: {
  workspaceId: string;
  sourceStoragePath: string;
  jobType?: IngestJobType;
}): Promise<IngestJob | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const jobType = input.jobType ?? 'ocr';
  const { data: existing, error: existingError } = await supabase
    .from('ingest_jobs')
    .select(
      'id, workspace_id, source_storage_path, job_type, status, attempts, last_error, created_at, updated_at',
    )
    .eq('workspace_id', input.workspaceId)
    .eq('source_storage_path', input.sourceStoragePath)
    .eq('job_type', jobType)
    .in('status', ['queued', 'processing'])
    .maybeSingle();

  if (existingError) {
    console.warn('Unable to read ingest job queue.', existingError.message);
    return null;
  }

  if (existing) {
    return toIngestJob(existing as DbIngestJobRow);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ingest_jobs')
    .insert({
      workspace_id: input.workspaceId,
      source_storage_path: input.sourceStoragePath,
      job_type: jobType,
      status: 'queued',
      attempts: 0,
      last_error: null,
      updated_at: now,
    })
    .select(
      'id, workspace_id, source_storage_path, job_type, status, attempts, last_error, created_at, updated_at',
    )
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to queue ingest job.', error?.message);
    return null;
  }

  return toIngestJob(data as DbIngestJobRow);
}

export async function claimNextIngestJob(jobType: IngestJobType = 'ocr'): Promise<IngestJob | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('ingest_jobs')
    .select(
      'id, workspace_id, source_storage_path, job_type, status, attempts, last_error, created_at, updated_at',
    )
    .eq('job_type', jobType)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from('ingest_jobs')
    .update({
      status: 'processing',
      attempts: (data as DbIngestJobRow).attempts + 1,
      updated_at: now,
    })
    .eq('id', (data as DbIngestJobRow).id)
    .eq('status', 'queued')
    .select(
      'id, workspace_id, source_storage_path, job_type, status, attempts, last_error, created_at, updated_at',
    )
    .maybeSingle();

  if (claimError || !claimed) {
    return null;
  }

  return toIngestJob(claimed as DbIngestJobRow);
}

export async function completeIngestJob(jobId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from('ingest_jobs')
    .update({
      status: 'completed',
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function failIngestJob(jobId: string, message: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from('ingest_jobs')
    .update({
      status: 'failed',
      last_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function requeueIngestJob(jobId: string, message: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from('ingest_jobs')
    .update({
      status: 'queued',
      last_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}
