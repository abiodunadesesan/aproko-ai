import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveExtractableKind } from './extract-document';

test('resolveExtractableKind detects pdf by extension and mime', () => {
  assert.equal(resolveExtractableKind('notes.pdf', null), 'pdf');
  assert.equal(resolveExtractableKind('file.bin', 'application/pdf'), 'pdf');
});

test('resolveExtractableKind detects text-like files', () => {
  assert.equal(resolveExtractableKind('readme.md', null), 'text');
  assert.equal(resolveExtractableKind('data.csv', 'text/csv'), 'text');
});

test('resolveExtractableKind returns null for unsupported types', () => {
  assert.equal(resolveExtractableKind('slides.pptx', null), null);
  assert.equal(resolveExtractableKind('photo.png', 'image/png'), null);
});
