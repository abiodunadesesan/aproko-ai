import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLiveContextModel } from './generation';

test('resolveLiveContextModel remaps deprecated Groq model when configured', () => {
  const originalGroq = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'gsk_test_key';

  try {
    assert.equal(
      resolveLiveContextModel('groq:llama-3.1-8b-instant'),
      'groq:openai/gpt-oss-20b',
    );
    assert.equal(resolveLiveContextModel(null), 'groq:openai/gpt-oss-20b');
  } finally {
    if (originalGroq === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroq;
    }
  }
});
