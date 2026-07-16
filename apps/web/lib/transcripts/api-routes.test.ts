import assert from 'node:assert/strict';
import test from 'node:test';
import { createTranscriptsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/transcripts/route';

test('transcripts GET returns 401 when unauthenticated', async () => {
  const handlers = createTranscriptsRouteHandlers({
    auth: async () => ({ userId: null }),
    listTranscriptSources: async () => [],
    uploadLibraryFile: async () => {
      throw new Error('unused');
    },
    transcribeAudioFile: async () => 'unused',
    isTranscriptionConfigured: () => true,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
});

test('transcripts POST uploads text transcript', async () => {
  const handlers = createTranscriptsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listTranscriptSources: async () => [],
    uploadLibraryFile: async (_workspaceId, file) => ({
      id: 'src-1',
      workspaceId: 'ws-1',
      name: file.name,
      project: 'transcripts',
      folder: 'uploads',
      objectPath: `ws-1/transcripts/uploads/${file.name}`,
      size: file.size,
      updatedAt: '2026-07-15T00:00:00.000Z',
      mimeType: file.type,
      sourceType: 'transcript',
    }),
    transcribeAudioFile: async () => 'unused',
    isTranscriptionConfigured: () => true,
  });

  const form = new FormData();
  form.append('file', new File(['Hello lecture'], 'lecture.txt', { type: 'text/plain' }));

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: form }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    data: { transcript: { name: string }; audio: null };
  };
  assert.equal(payload.data.transcript.name, 'lecture.txt');
  assert.equal(payload.data.audio, null);
});

test('transcripts POST returns 503 when audio STT is not configured', async () => {
  const handlers = createTranscriptsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listTranscriptSources: async () => [],
    uploadLibraryFile: async () => {
      throw new Error('should not upload');
    },
    transcribeAudioFile: async () => 'unused',
    isTranscriptionConfigured: () => false,
  });

  const form = new FormData();
  form.append('audio', new File([new Uint8Array([1, 2, 3])], 'clip.webm', { type: 'audio/webm' }));

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: form }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 503);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /GROQ_API_KEY|OPENAI_API_KEY/i);
});

test('transcripts POST transcribes audio when configured', async () => {
  const uploads: string[] = [];
  const handlers = createTranscriptsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listTranscriptSources: async () => [],
    uploadLibraryFile: async (_workspaceId, file) => {
      uploads.push(file.name);
      return {
        id: `src-${uploads.length}`,
        workspaceId: 'ws-1',
        name: file.name,
        project: 'transcripts',
        folder: file.name.endsWith('.txt') ? 'uploads' : 'recordings',
        objectPath: `ws-1/transcripts/${file.name}`,
        size: file.size,
        updatedAt: '2026-07-15T00:00:00.000Z',
        mimeType: file.type,
        sourceType: file.name.endsWith('.txt') ? 'transcript' : 'audio',
      };
    },
    transcribeAudioFile: async () => 'Welcome to lecture one.',
    isTranscriptionConfigured: () => true,
  });

  const form = new FormData();
  form.append(
    'audio',
    new File([new Uint8Array([1, 2, 3, 4])], 'clip.webm', { type: 'audio/webm' }),
  );

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: form }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(uploads, ['clip.webm', 'clip-transcript.txt']);
  const payload = (await response.json()) as {
    data: { transcript: { name: string }; audio: { name: string } | null };
  };
  assert.equal(payload.data.audio?.name, 'clip.webm');
  assert.equal(payload.data.transcript.name, 'clip-transcript.txt');
});
