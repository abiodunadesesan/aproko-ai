import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PENDING_DELETE_MS,
  createPendingJobId,
  isPendingJobActive,
  removeByIds,
  subtractIds,
  upsertIds,
} from './pending-delete';

test('createPendingJobId is deterministic with provided seeds', () => {
  const id = createPendingJobId(1700000000000, 0.5);
  assert.equal(id, '1700000000000-7a120');
});

test('removeByIds removes only matching ids', () => {
  const input = [
    { id: 'a', value: 1 },
    { id: 'b', value: 2 },
    { id: 'c', value: 3 },
  ];
  const output = removeByIds(input, ['b']);
  assert.deepEqual(output, [
    { id: 'a', value: 1 },
    { id: 'c', value: 3 },
  ]);
});

test('upsertIds merges ids without duplicates', () => {
  const output = upsertIds(['a', 'b'], ['b', 'c']);
  assert.deepEqual(output, ['a', 'b', 'c']);
});

test('subtractIds removes targeted ids from selection', () => {
  const output = subtractIds(['a', 'b', 'c'], ['b', 'x']);
  assert.deepEqual(output, ['a', 'c']);
});

test('isPendingJobActive only matches exact current job id', () => {
  assert.equal(isPendingJobActive('job-1', 'job-1'), true);
  assert.equal(isPendingJobActive('job-1', 'job-2'), false);
  assert.equal(isPendingJobActive('job-1', null), false);
});

test('source delete flow can queue then undo', () => {
  const sources = [
    { id: 's1', name: 'Doc A' },
    { id: 's2', name: 'Doc B' },
    { id: 's3', name: 'Doc C' },
  ];
  const selected = ['s1', 's2'];

  const queued = removeByIds(sources, selected);
  assert.deepEqual(queued, [{ id: 's3', name: 'Doc C' }]);

  const undoSelection = upsertIds([], selected);
  assert.deepEqual(undoSelection, ['s1', 's2']);
});

test('source delete flow can queue then finalize selection cleanup', () => {
  const selected = ['s1', 's2', 's3'];
  const deleted = ['s1', 's3'];

  const remaining = subtractIds(selected, deleted);
  assert.deepEqual(remaining, ['s2']);
});

test('pending delete timeout constant is five seconds', () => {
  assert.equal(PENDING_DELETE_MS, 5000);
});
