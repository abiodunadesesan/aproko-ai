import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkText, estimateTokenCount } from './chunk-text';

test('chunkText returns empty array for blank input', () => {
  assert.deepEqual(chunkText('   '), []);
});

test('chunkText returns single chunk for short text', () => {
  assert.deepEqual(chunkText('Hello world'), ['Hello world']);
});

test('chunkText splits long text with overlap', () => {
  const input = 'a'.repeat(5000);
  const chunks = chunkText(input, { chunkSize: 2000, overlap: 200 });
  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0]?.length, 2000);
  assert.ok(chunks[1]?.startsWith('a'.repeat(200)));
});

test('estimateTokenCount approximates by character length', () => {
  assert.equal(estimateTokenCount('abcd'), 1);
  assert.equal(estimateTokenCount('a'.repeat(40)), 10);
});
