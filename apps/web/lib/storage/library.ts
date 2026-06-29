import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  DEFAULT_FOLDER_SLUG,
  DEFAULT_PROJECT_SLUG,
  sanitizeSlug,
} from '@/lib/storage/workspace-taxonomy';

export type LibrarySource = {
  id: string;
  workspaceId: string;
  name: string;
  project: string;
  folder: string;
  objectPath: string;
  size: number;
  updatedAt: string | null;
  mimeType: string | null;
};

type DbSourceRecord = {
  storage_path: string;
  display_name?: string | null;
  project_slug?: string | null;
  folder_slug?: string | null;
  project_id?: string | null;
  folder_id?: string | null;
  byte_size?: number | null;
  mime_type?: string | null;
  updated_at?: string | null;
};

export function getLibraryBucketName(): string {
  return process.env.SUPABASE_LIBRARY_BUCKET ?? 'aproko-library';
}

function parseProjectAndFolder(objectPath: string): { project: string; folder: string } {
  const parts = objectPath.split('/');
  return {
    project: parts[1] ?? DEFAULT_PROJECT_SLUG,
    folder: parts[2] ?? DEFAULT_FOLDER_SLUG,
  };
}

function encodeSourceId(objectPath: string): string {
  return encodeURIComponent(objectPath);
}

function decodeSourceId(sourceId: string): string {
  return decodeURIComponent(sourceId);
}

function inferSourceType(fileName: string, mimeType: string | null): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  if (ext === 'txt') return 'txt';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('audio/')) return 'audio';
  return 'note_import';
}

function toSourceFromStorage(
  workspaceId: string,
  objectPath: string,
  item: {
    name: string;
    updated_at?: string | null;
    metadata?: { size?: number; mimetype?: string } | null;
  },
): LibrarySource {
  const { project, folder } = parseProjectAndFolder(objectPath);

  return {
    id: encodeSourceId(objectPath),
    workspaceId,
    name: item.name,
    project,
    folder,
    objectPath,
    size: item.metadata?.size ?? 0,
    updatedAt: item.updated_at ?? null,
    mimeType: item.metadata?.mimetype ?? null,
  };
}

function toSourceFromDb(workspaceId: string, row: DbSourceRecord): LibrarySource {
  const { project, folder } = parseProjectAndFolder(row.storage_path);
  const fileNameFromPath = row.storage_path.split('/').pop() ?? 'file';

  return {
    id: encodeSourceId(row.storage_path),
    workspaceId,
    name: row.display_name ?? fileNameFromPath,
    project: row.project_slug ?? project,
    folder: row.folder_slug ?? folder,
    objectPath: row.storage_path,
    size: row.byte_size ?? 0,
    updatedAt: row.updated_at ?? null,
    mimeType: row.mime_type ?? null,
  };
}

async function listObjectsRecursive(
  workspaceId: string,
  prefix: string,
  visited: Set<string>,
): Promise<LibrarySource[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  if (visited.has(prefix)) {
    return [];
  }

  visited.add(prefix);

  const { data, error } = await supabase.storage
    .from(getLibraryBucketName())
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (error || !data) {
    return [];
  }

  const sources: LibrarySource[] = [];

  for (const item of data) {
    const currentPath = `${prefix}/${item.name}`;

    if (item.id === null) {
      const nested = await listObjectsRecursive(workspaceId, currentPath, visited);
      sources.push(...nested);
      continue;
    }

    sources.push(toSourceFromStorage(workspaceId, currentPath, item));
  }

  return sources;
}

async function listSourcesFromDatabase(workspaceId: string): Promise<LibrarySource[] | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('sources')
    .select(
      'storage_path, display_name, project_slug, folder_slug, byte_size, mime_type, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('DB source listing unavailable; falling back to storage listing.', error.message);
    return null;
  }

  return ((data ?? []) as DbSourceRecord[]).map((row) => toSourceFromDb(workspaceId, row));
}

async function persistSourceMetadata(params: {
  workspaceId: string;
  objectPath: string;
  fileName: string;
  projectId: string | null;
  folderId: string | null;
  project: string;
  folder: string;
  mimeType: string | null;
  fileSize: number;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const sourceType = inferSourceType(params.fileName, params.mimeType);

  const extendedPayload = {
    workspace_id: params.workspaceId,
    source_type: sourceType,
    storage_path: params.objectPath,
    status: 'ready',
    project_id: params.projectId,
    folder_id: params.folderId,
    display_name: params.fileName,
    project_slug: params.project,
    folder_slug: params.folder,
    mime_type: params.mimeType,
    byte_size: params.fileSize,
  };

  const extendedResult = await supabase.from('sources').insert(extendedPayload);

  if (!extendedResult.error) {
    return;
  }

  const fallbackPayload = {
    workspace_id: params.workspaceId,
    source_type: sourceType,
    storage_path: params.objectPath,
    status: 'ready',
  };

  const fallbackResult = await supabase.from('sources').insert(fallbackPayload);

  if (fallbackResult.error) {
    console.warn('Unable to persist source metadata to database.', fallbackResult.error.message);
  }
}

export async function listLibrarySources(workspaceId: string): Promise<LibrarySource[]> {
  const dbSources = await listSourcesFromDatabase(workspaceId);

  if (dbSources && dbSources.length > 0) {
    return dbSources;
  }

  const prefix = workspaceId;
  const sources = await listObjectsRecursive(workspaceId, prefix, new Set<string>());

  return sources.sort((a, b) => {
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bTime - aTime;
  });
}

export async function uploadLibraryFile(
  workspaceId: string,
  file: File,
  projectRaw: string | null,
  folderRaw: string | null,
  projectId: string | null = null,
  folderId: string | null = null,
): Promise<LibrarySource> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error('Supabase admin client is not configured.');
  }

  const project = sanitizeSlug(projectRaw, DEFAULT_PROJECT_SLUG);
  const folder = sanitizeSlug(folderRaw, DEFAULT_FOLDER_SLUG);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${workspaceId}/${project}/${folder}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(getLibraryBucketName())
    .upload(objectPath, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (error || !data) {
    throw new Error(error?.message || 'Upload failed');
  }

  await persistSourceMetadata({
    workspaceId,
    objectPath,
    fileName: file.name,
    projectId,
    folderId,
    project,
    folder,
    mimeType: file.type || null,
    fileSize: file.size,
  });

  return {
    id: encodeSourceId(objectPath),
    workspaceId,
    name: file.name,
    project,
    folder,
    objectPath,
    size: file.size,
    updatedAt: new Date().toISOString(),
    mimeType: file.type || null,
  };
}

export async function getLibrarySource(
  workspaceId: string,
  sourceId: string,
): Promise<LibrarySource | null> {
  const objectPath = decodeSourceId(sourceId);

  if (!objectPath.startsWith(`${workspaceId}/`)) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const dbLookup = await supabase
    .from('sources')
    .select(
      'storage_path, display_name, project_slug, folder_slug, byte_size, mime_type, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .eq('storage_path', objectPath)
    .maybeSingle();

  if (!dbLookup.error && dbLookup.data) {
    return toSourceFromDb(workspaceId, dbLookup.data as DbSourceRecord);
  }

  const pathParts = objectPath.split('/');
  const filename = pathParts[pathParts.length - 1] ?? '';
  const parent = pathParts.slice(0, -1).join('/');

  const { data, error } = await supabase.storage.from(getLibraryBucketName()).list(parent, {
    limit: 100,
    search: filename,
  });

  if (error || !data) {
    return null;
  }

  const item = data.find((entry) => entry.name === filename && entry.id !== null);

  if (!item) {
    return null;
  }

  return toSourceFromStorage(workspaceId, objectPath, item);
}

export async function getLibrarySignedUrl(
  objectPath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(getLibraryBucketName())
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

export async function updateLibrarySourceMetadata(params: {
  workspaceId: string;
  sourceId: string;
  displayName?: string | null;
  projectSlug?: string | null;
  folderSlug?: string | null;
  projectId?: string | null;
  folderId?: string | null;
}): Promise<LibrarySource | null> {
  const existing = await getLibrarySource(params.workspaceId, params.sourceId);

  if (!existing) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const normalizedName = params.displayName?.trim() || existing.name;
  const normalizedProject = sanitizeSlug(params.projectSlug, existing.project);
  const normalizedFolder = sanitizeSlug(params.folderSlug, existing.folder);

  if (!supabase) {
    return {
      ...existing,
      name: normalizedName,
      project: normalizedProject,
      folder: normalizedFolder,
      updatedAt: new Date().toISOString(),
    };
  }

  const updatePayload: {
    display_name: string;
    project_slug: string;
    folder_slug: string;
    project_id?: string | null;
    folder_id?: string | null;
  } = {
    display_name: normalizedName,
    project_slug: normalizedProject,
    folder_slug: normalizedFolder,
  };

  if (params.projectId !== undefined) {
    updatePayload.project_id = params.projectId;
  }

  if (params.folderId !== undefined) {
    updatePayload.folder_id = params.folderId;
  }

  const dbResult = await supabase
    .from('sources')
    .update(updatePayload)
    .eq('workspace_id', params.workspaceId)
    .eq('storage_path', existing.objectPath)
    .select(
      'storage_path, display_name, project_slug, folder_slug, project_id, folder_id, byte_size, mime_type, updated_at',
    )
    .maybeSingle();

  if (!dbResult.error && dbResult.data) {
    return toSourceFromDb(params.workspaceId, dbResult.data as DbSourceRecord);
  }

  if (dbResult.error) {
    console.warn('Unable to update source metadata in DB.', dbResult.error.message);
  }

  return {
    ...existing,
    name: normalizedName,
    project: normalizedProject,
    folder: normalizedFolder,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteLibrarySource(workspaceId: string, sourceId: string): Promise<boolean> {
  const objectPath = decodeSourceId(sourceId);

  if (!objectPath.startsWith(`${workspaceId}/`)) {
    return false;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const storageDelete = await supabase.storage.from(getLibraryBucketName()).remove([objectPath]);

  if (storageDelete.error) {
    console.warn('Unable to delete source from storage.', storageDelete.error.message);
    return false;
  }

  const dbDelete = await supabase
    .from('sources')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('storage_path', objectPath);

  if (dbDelete.error) {
    console.warn('Unable to delete source metadata from DB.', dbDelete.error.message);
  }

  return true;
}
