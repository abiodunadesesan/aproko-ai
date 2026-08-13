import assert from 'node:assert/strict';
import test from 'node:test';
import { ingestLibrarySource } from './ingest-source';
import type { LibrarySource } from '@/lib/storage/library';

const baseSource: LibrarySource = {
  id: 'src-1',
  workspaceId: 'ws-1',
  name: 'lecture.pdf',
  project: 'research',
  folder: 'inbox',
  objectPath: 'ws-1/research/inbox/lecture.pdf',
  size: 1024,
  updatedAt: null,
  mimeType: 'application/pdf',
  sourceType: 'pdf',
};

test('ingestLibrarySource skips unsupported file types', async () => {
  const result = await ingestLibrarySource({
    ...baseSource,
    name: 'image.png',
    mimeType: 'image/png',
    sourceType: 'image',
  });
  assert.deepEqual(result, { status: 'skipped', reason: 'unsupported_type' });
});
