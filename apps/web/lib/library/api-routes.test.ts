import assert from 'node:assert/strict';
import test from 'node:test';
import { createSourcesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/sources/route';
import { createSourceByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/sources/[sourceId]/route';
import { createProjectsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/projects/route';
import { createProjectFoldersRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/projects/[projectId]/folders/route';
import { createProjectByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/projects/[projectId]/route';
import { createFolderByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/folders/[folderId]/route';
import { createSourceReprocessRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/sources/[sourceId]/reprocess/route';

test('sources GET returns 401 when unauthenticated', async () => {
  const handlers = createSourcesRouteHandlers({
    auth: async () => ({ userId: null }),
    listLibrarySources: async () => [],
    uploadLibraryFile: async () => {
      throw new Error('not expected');
    },
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('sources POST validates file and returns 400', async () => {
  const handlers = createSourcesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listLibrarySources: async () => [],
    uploadLibraryFile: async () => {
      throw new Error('not expected');
    },
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const formData = new FormData();
  formData.append('project', 'alpha');
  const request = new Request('http://localhost', { method: 'POST', body: formData });

  const response = await handlers.POST(request, {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'File is required' });
});

test('sources POST resolves project/folder via ids before upload', async () => {
  let capturedArgs: unknown[] | null = null;

  const handlers = createSourcesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listLibrarySources: async () => [],
    uploadLibraryFile: async (...args) => {
      capturedArgs = [...args];
      return {
        source: {
          id: 'source-1',
          workspaceId: args[0] as string,
          name: (args[1] as File).name,
          project: (args[2] as string | null) ?? 'general',
          folder: (args[3] as string | null) ?? 'inbox',
          objectPath: 'ws-1/general/inbox/file.txt',
          size: 4,
          updatedAt: new Date().toISOString(),
          mimeType: 'text/plain',
          ingestStatus: 'ready',
        },
        ingest: { status: 'ingested', chunkCount: 1, characterCount: 4 },
      };
    },
    getWorkspaceProjectById: async () => ({
      id: 'p1',
      workspaceId: 'ws-1',
      name: 'Alpha',
      slug: 'alpha',
      updatedAt: null,
    }),
    getWorkspaceFolderById: async () => ({
      id: 'f1',
      workspaceId: 'ws-1',
      projectId: 'p1',
      name: 'Inbox',
      slug: 'inbox',
      updatedAt: null,
    }),
  });

  const formData = new FormData();
  formData.append('file', new File(['data'], 'file.txt', { type: 'text/plain' }));
  formData.append('projectId', 'p1');
  formData.append('folderId', 'f1');
  formData.append('project', 'fallback-project');
  formData.append('folder', 'fallback-folder');

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: formData }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 201);
  assert.ok(capturedArgs);
  assert.equal(capturedArgs?.[0], 'ws-1');
  assert.equal(capturedArgs?.[2], 'alpha');
  assert.equal(capturedArgs?.[3], 'inbox');
});

test('source by id PATCH returns 404 when metadata update misses', async () => {
  const handlers = createSourceByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getLibrarySource: async () => null,
    getLibrarySignedUrl: async () => null,
    updateLibrarySourceMetadata: async () => null,
    deleteLibrarySource: async () => true,
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const request = new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Renamed' }),
  });

  const response = await handlers.PATCH(request, {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Source not found' });
});

test('source by id GET returns 404 when source missing', async () => {
  const handlers = createSourceByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getLibrarySource: async () => null,
    getLibrarySignedUrl: async () => null,
    updateLibrarySourceMetadata: async () => null,
    deleteLibrarySource: async () => true,
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Source not found' });
});

test('source by id DELETE returns 404 when delete fails', async () => {
  const handlers = createSourceByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getLibrarySource: async () => null,
    getLibrarySignedUrl: async () => null,
    updateLibrarySourceMetadata: async () => null,
    deleteLibrarySource: async () => false,
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const response = await handlers.DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Source not found or delete failed' });
});

test('source by id GET returns 500 when backend throws', async () => {
  const handlers = createSourceByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getLibrarySource: async () => {
      throw new Error('db-down');
    },
    getLibrarySignedUrl: async () => null,
    updateLibrarySourceMetadata: async () => null,
    deleteLibrarySource: async () => true,
    getWorkspaceProjectById: async () => null,
    getWorkspaceFolderById: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to fetch source' });
});

test('projects POST validates required name', async () => {
  const handlers = createProjectsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceProjects: async () => [],
    createWorkspaceProject: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Project name is required' });
});

test('projects POST returns 201 with created payload', async () => {
  const handlers = createProjectsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceProjects: async () => [],
    createWorkspaceProject: async () => ({
      id: 'p1',
      workspaceId: 'ws-1',
      name: 'Alpha',
      slug: 'alpha',
      updatedAt: null,
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.data.slug, 'alpha');
});

test('project folders POST validates required name', async () => {
  const handlers = createProjectFoldersRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceFolders: async () => [],
    createWorkspaceFolder: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', projectId: 'p1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Folder name is required' });
});

test('project folders POST returns 201 when created', async () => {
  const handlers = createProjectFoldersRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceFolders: async () => [],
    createWorkspaceFolder: async () => ({
      id: 'f1',
      workspaceId: 'ws-1',
      projectId: 'p1',
      name: 'Inbox',
      slug: 'inbox',
      updatedAt: null,
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Inbox' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', projectId: 'p1' }) },
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.data.slug, 'inbox');
});

test('project by id GET returns 404 for missing project', async () => {
  const handlers = createProjectByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceProjectById: async () => null,
    updateWorkspaceProject: async () => null,
    deleteWorkspaceProject: async () => false,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', projectId: 'p1' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Project not found' });
});

test('project by id PATCH validates empty name with 400', async () => {
  const handlers = createProjectByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceProjectById: async () => null,
    updateWorkspaceProject: async () => null,
    deleteWorkspaceProject: async () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', projectId: 'p1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Project name is required' });
});

test('project by id DELETE returns 500 when backend throws', async () => {
  const handlers = createProjectByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceProjectById: async () => null,
    updateWorkspaceProject: async () => null,
    deleteWorkspaceProject: async () => {
      throw new Error('db-down');
    },
  });

  const response = await handlers.DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', projectId: 'p1' }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to delete project' });
});

test('folder by id GET returns 404 for missing folder', async () => {
  const handlers = createFolderByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceFolderById: async () => null,
    updateWorkspaceFolder: async () => null,
    deleteWorkspaceFolder: async () => false,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', folderId: 'f1' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Folder not found' });
});

test('folder by id PATCH validates empty name with 400', async () => {
  const handlers = createFolderByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceFolderById: async () => null,
    updateWorkspaceFolder: async () => null,
    deleteWorkspaceFolder: async () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', folderId: 'f1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Folder name is required' });
});

test('folder by id DELETE returns 500 when backend throws', async () => {
  const handlers = createFolderByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceFolderById: async () => null,
    updateWorkspaceFolder: async () => null,
    deleteWorkspaceFolder: async () => {
      throw new Error('db-down');
    },
  });

  const response = await handlers.DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', folderId: 'f1' }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to delete folder' });
});

test('source reprocess POST returns 401 when unauthenticated', async () => {
  const handlers = createSourceReprocessRouteHandlers({
    auth: async () => ({ userId: null }),
    getLibrarySource: async () => null,
    reprocessLibrarySource: async () => ({ status: 'failed', reason: 'not expected' }),
  });

  const response = await handlers.POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 401);
});

test('source reprocess POST returns ingest payload', async () => {
  const handlers = createSourceReprocessRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getLibrarySource: async () => ({
      id: 'src-1',
      workspaceId: 'ws-1',
      name: 'notes.docx',
      project: 'general',
      folder: 'inbox',
      objectPath: 'ws-1/general/inbox/notes.docx',
      size: 100,
      updatedAt: null,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ingestStatus: 'ready',
    }),
    reprocessLibrarySource: async () => ({
      status: 'ingested',
      chunkCount: 3,
      characterCount: 900,
    }),
  });

  const response = await handlers.POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', sourceId: 'src-1' }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    ingest: { status: string; chunkCount: number };
  };
  assert.equal(payload.ingest.status, 'ingested');
  assert.equal(payload.ingest.chunkCount, 3);
});
