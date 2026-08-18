import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLiveContextSystemPrompt,
  formatCapturedPageText,
  pageTextToPreviewBullets,
  parseHoverFocus,
  redactSensitivePageText,
  sanitizeLiveBrowserContext,
  summarizePageSnapshot,
} from './sanitize';

test('sanitizeLiveBrowserContext requires query, url, and page text', () => {
  const missing = sanitizeLiveBrowserContext({});
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.match(missing.error, /userQuery/i);
  }
});

test('sanitizeLiveBrowserContext accepts FasterFlow message and hoverContext aliases', () => {
  const result = sanitizeLiveBrowserContext({
    url: 'https://example.com/doc',
    title: 'Doc',
    fullPageContext: 'Membranes control what enters the cell.',
    hoverContext: 'osmosis',
    message: 'Explain this sentence',
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.context.pageText, /Membranes/);
    assert.equal(result.context.activeHoverContext, 'osmosis');
    assert.equal(result.context.userQuery, 'Explain this sentence');
  }
});

test('sanitizeLiveBrowserContext truncates oversized page text', () => {
  const result = sanitizeLiveBrowserContext(
    {
      url: 'https://example.com/doc',
      title: 'Doc',
      pageText: 'x'.repeat(100),
      userQuery: 'Summarize',
      capturedAt: '2026-08-16T08:00:00.000Z',
    },
    { maxPageText: 40 },
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.context.truncated, true);
    assert.match(result.context.pageText, /truncated/i);
    assert.ok(result.context.pageText.length < 100);
  }
});

test('redactSensitivePageText drops password-like lines', () => {
  const redacted = redactSensitivePageText('Hello\nPassword: hunter2\nKeep this');
  assert.doesNotMatch(redacted, /hunter2/);
  assert.match(redacted, /Keep this/);
});

test('formatCapturedPageText splits jammed nav words', () => {
  const formatted = formatCapturedPageText('GOURMETBAKES & MOREMenuAboutBulkOrdersRecipes');
  assert.match(formatted, /Menu/);
  assert.match(formatted, /About/);
  assert.match(formatted, /Bulk/);
});

test('pageTextToPreviewBullets returns list items', () => {
  const bullets = pageTextToPreviewBullets('Welcome home\nMeat pies daily\nOrder now for parties');
  assert.deepEqual(bullets, ['Welcome home', 'Meat pies daily', 'Order now for parties']);
});

test('parseHoverFocus extracts tag, primary, and surrounding blocks', () => {
  const parsed = parseHoverFocus(
    '[Hover node: a]\nStudy Guide\n\n[Parent / surrounding block]\nQuiz Mind Map Study Guide',
  );
  assert.equal(parsed.tagName, 'a');
  assert.equal(parsed.primaryText, 'Study Guide');
  assert.match(parsed.surroundingText, /Quiz Mind Map/);
});

test('parseHoverFocus keeps heading tags like h2 (not h 2)', () => {
  const parsed = parseHoverFocus(
    '[Hover node: h2]\n1. Which characteristic is common to all living organisms?',
  );
  assert.equal(parsed.tagName, 'h2');
  assert.match(parsed.primaryText, /living organisms/i);
});

test('summarizePageSnapshot prefers page topic over chrome nav', () => {
  const snapshot = summarizePageSnapshot(
    [
      'Search',
      'Take Quizzes',
      'Create a Quiz',
      'Study Guide',
      '1. Which characteristic is common to all living organisms?',
      'A. Movement',
      'B. Photosynthesis',
      'C. Cellular organization',
      'D. Having a brain',
      'Start Quiz',
      'Pre-K',
      '1st Grade',
    ].join('\n'),
    'Characteristics Of Life Quiz | ProProfs',
  );

  assert.match(snapshot.summary, /Characteristics Of Life Quiz/i);
  assert.doesNotMatch(snapshot.summary, /^Search/i);
  assert.ok(snapshot.highlights.some((line) => /living organisms/i.test(line)));
  assert.ok(!snapshot.highlights.includes('Search'));
  assert.ok(!snapshot.highlights.includes('Pre-K'));
});

test('buildLiveContextSystemPrompt prioritizes cursor hover context', () => {
  const prompt = buildLiveContextSystemPrompt({
    url: 'https://example.com',
    title: 'Example',
    pageText: 'Visible body background',
    activeHoverContext: 'Hovered exam question: solve for x',
    capturedAt: '2026-08-16T08:00:00.000Z',
    userQuery: 'What is this?',
    truncated: false,
  });

  assert.match(prompt, /CURSOR FOCUS/);
  assert.match(prompt, /Hovered exam question/);
  assert.match(prompt, /FULL PAGE BACKGROUND/);
  assert.match(prompt, /Visible body background/);
});
