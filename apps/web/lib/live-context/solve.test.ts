import assert from 'node:assert/strict';
import test from 'node:test';

// Lightweight parse mirror of solve.ts normalization rules for regression safety.
function normalizeSolveResult(value) {
  const obj = value && typeof value === 'object' ? value : {};
  const kindRaw = typeof obj.kind === 'string' ? obj.kind.toLowerCase() : 'explain';
  const kind = kindRaw === 'mcq' || kindRaw === 'short' || kindRaw === 'explain' ? kindRaw : 'explain';
  return {
    kind,
    optionKey:
      typeof obj.optionKey === 'string' && obj.optionKey.trim()
        ? obj.optionKey.trim().toUpperCase().slice(0, 4)
        : null,
    fillText:
      typeof obj.fillText === 'string' && obj.fillText.trim() ? obj.fillText.trim() : null,
  };
}

test('normalizeSolveResult maps mcq option keys', () => {
  const result = normalizeSolveResult({ kind: 'mcq', optionKey: 'b', fillText: null });
  assert.equal(result.kind, 'mcq');
  assert.equal(result.optionKey, 'B');
});

test('normalizeSolveResult keeps short fill text', () => {
  const result = normalizeSolveResult({ kind: 'short', fillText: '  y = e^x  ' });
  assert.equal(result.kind, 'short');
  assert.equal(result.fillText, 'y = e^x');
});
