import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLandingLocale } from './server';

test('resolveLandingLocale prefers cookie over Accept-Language', () => {
  assert.equal(
    resolveLandingLocale({
      cookieValue: 'de',
      acceptLanguage: 'fr-FR,fr;q=0.9',
    }),
    'de',
  );
});

test('resolveLandingLocale falls back to Accept-Language', () => {
  assert.equal(
    resolveLandingLocale({
      acceptLanguage: 'es-ES,es;q=0.9,en;q=0.8',
    }),
    'es',
  );
});

test('resolveLandingLocale defaults to English', () => {
  assert.equal(resolveLandingLocale({ acceptLanguage: 'ja-JP,ja;q=0.9' }), 'en');
});
