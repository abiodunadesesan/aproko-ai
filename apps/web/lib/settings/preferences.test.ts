import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  parsePreferencesPatch,
} from './preferences';

test('normalizeUserPreferences applies defaults for empty input', () => {
  assert.deepEqual(normalizeUserPreferences(null), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(normalizeUserPreferences({}), DEFAULT_USER_PREFERENCES);
});

test('normalizeUserPreferences keeps valid fields', () => {
  assert.deepEqual(
    normalizeUserPreferences({
      defaultChatModel: 'openai:gpt-4o-mini',
      autoMemoryCapture: false,
    }),
    {
      defaultChatModel: 'openai:gpt-4o-mini',
      autoMemoryCapture: false,
    },
  );
});

test('parsePreferencesPatch rejects invalid model', () => {
  const result = parsePreferencesPatch({ defaultChatModel: 'gpt-4.1-mini' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /defaultChatModel/);
  }
});

test('parsePreferencesPatch accepts valid partial patch', () => {
  const result = parsePreferencesPatch({
    defaultChatModel: 'groq:llama-3.1-8b-instant',
    autoMemoryCapture: true,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.preferences.defaultChatModel, 'groq:llama-3.1-8b-instant');
  }
});
