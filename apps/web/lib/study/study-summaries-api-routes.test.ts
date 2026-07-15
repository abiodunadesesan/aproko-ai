import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudySummariesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/summaries/route';
import { createStudySummaryGenerateRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/summaries/generate/route';

test('study summaries GET returns 401 when unauthenticated', async () => {
  const handlers = createStudySummariesRouteHandlers({
    auth: async () => ({ userId: null }),
    listStudySummaries: async () => [],
    createStudySummary: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('study summaries POST creates summary', async () => {
  const handlers = createStudySummariesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listStudySummaries: async () => [],
    createStudySummary: async () => ({
      id: 'summary-1',
      workspaceId: 'ws-1',
      summaryType: 'study',
      title: 'Study Summary: Biology',
      content: '## Overview\nBiology notes summary.',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Study Summary: Biology',
        content: '## Overview\nBiology notes summary.',
        sourceNoteId: 'note-1',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; summaryType: string } };
  assert.equal(payload.data.id, 'summary-1');
  assert.equal(payload.data.summaryType, 'study');
});

test('study summary generate POST creates summary from specific note', async () => {
  const handlers = createStudySummaryGenerateRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceNotes: async () => [],
    getWorkspaceNoteById: async () => ({
      id: 'note-1',
      workspaceId: 'ws-1',
      title: 'Cell Biology',
      content:
        'The cell membrane controls what enters and leaves the cell. Mitochondria produce ATP for energy.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    readLibrarySourceText: async () => null,
    generateStudySummaryMarkdown: async () => '## Overview\nLLM summary',
    generateSlideOutlineMarkdown: async () => '# Slide Outline\n## Title\n- Topic',
    createStudySummary: async (_workspaceId, title, content, sourceNoteId) => ({
      id: 'summary-1',
      workspaceId: 'ws-1',
      summaryType: 'study',
      title,
      content,
      sourceNoteId: sourceNoteId ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    data: { id: string; sourceNoteId: string | null; content: string; title: string };
  };
  assert.equal(payload.data.id, 'summary-1');
  assert.equal(payload.data.sourceNoteId, 'note-1');
  assert.equal(payload.data.content, '## Overview\nLLM summary');
  assert.match(payload.data.title, /^Study Summary:/);
});

test('study summary generate POST creates slide outline from sourceId', async () => {
  const handlers = createStudySummaryGenerateRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceNotes: async () => [],
    getWorkspaceNoteById: async () => null,
    readLibrarySourceText: async () => ({
      title: 'lecture.txt',
      content: 'Intro to HTML and CSS for building pages.',
      sourceId: 'src-1',
    }),
    generateStudySummaryMarkdown: async () => 'unused',
    generateSlideOutlineMarkdown: async () => '# Slide Outline\n## Intro\n- HTML',
    createStudySummary: async (_workspaceId, title, content, sourceNoteId) => ({
      id: 'outline-1',
      workspaceId: 'ws-1',
      summaryType: 'study',
      title,
      content,
      sourceNoteId: sourceNoteId ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceId: 'src-1', kind: 'outline' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { title: string; content: string } };
  assert.match(payload.data.title, /^Slide Outline:/);
  assert.match(payload.data.content, /Slide Outline/);
});

test('study summary generate POST returns 400 with no notes context', async () => {
  const handlers = createStudySummaryGenerateRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceNotes: async () => [],
    getWorkspaceNoteById: async () => null,
    readLibrarySourceText: async () => null,
    generateStudySummaryMarkdown: async () => 'unused',
    generateSlideOutlineMarkdown: async () => 'unused',
    createStudySummary: async () => null,
  });

  const response = await handlers.POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'No workspace notes found for generation',
  });
});
