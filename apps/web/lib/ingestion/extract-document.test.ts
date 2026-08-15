import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveExtractableKind, shouldUseAsyncIngest, MAX_SYNC_INGEST_BYTES } from './extract-document';

test('resolveExtractableKind detects pdf by extension and mime', () => {
  assert.equal(resolveExtractableKind('notes.pdf', null), 'pdf');
  assert.equal(resolveExtractableKind('file.bin', 'application/pdf'), 'pdf');
});

test('resolveExtractableKind detects text-like files', () => {
  assert.equal(resolveExtractableKind('readme.md', null), 'text');
  assert.equal(resolveExtractableKind('data.csv', 'text/csv'), 'text');
});

test('resolveExtractableKind detects docx by extension and mime', () => {
  assert.equal(resolveExtractableKind('report.docx', null), 'docx');
  assert.equal(
    resolveExtractableKind(
      'file.bin',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ),
    'docx',
  );
});

test('resolveExtractableKind detects pptx by extension and mime', () => {
  assert.equal(resolveExtractableKind('deck.pptx', null), 'pptx');
  assert.equal(
    resolveExtractableKind(
      'file.bin',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ),
    'pptx',
  );
});

test('shouldUseAsyncIngest flags files above sync limit', () => {
  assert.equal(shouldUseAsyncIngest(MAX_SYNC_INGEST_BYTES), false);
  assert.equal(shouldUseAsyncIngest(MAX_SYNC_INGEST_BYTES + 1), true);
});

test('resolveExtractableKind returns null for unsupported types', () => {
  assert.equal(resolveExtractableKind('photo.png', 'image/png'), null);
});
