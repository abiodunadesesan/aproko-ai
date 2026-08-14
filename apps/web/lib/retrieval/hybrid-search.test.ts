import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeHybridSourceResults } from './hybrid-search';

test('mergeHybridSourceResults keeps highest score per id', () => {
  const merged = mergeHybridSourceResults(
    [
      { id: 'a', score: 2 },
      { id: 'b', score: 1.5 },
    ],
    [
      { id: 'a', score: 3.2 },
      { id: 'c', score: 2.8 },
    ],
    10,
  );

  assert.deepEqual(
    merged.map((item) => item.id),
    ['a', 'c', 'b'],
  );
  assert.equal(merged[0]?.score, 3.2);
});

test('mergeHybridSourceResults respects limit', () => {
  const merged = mergeHybridSourceResults([{ id: 'a', score: 2 }], [{ id: 'b', score: 3 }], 1);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, 'b');
});
