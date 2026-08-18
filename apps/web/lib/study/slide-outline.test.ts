import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSlideOutlineMarkdown } from './slide-outline';

test('parseSlideOutlineMarkdown splits markdown headings into slides', () => {
  const markdown = `# Title Slide
- Welcome to Biology

## Cell Structure
- Nucleus
- Membrane

## Closing
- Questions?`;

  const slides = parseSlideOutlineMarkdown(markdown);
  assert.equal(slides.length, 3);
  assert.equal(slides[0]?.kind, 'title');
  assert.equal(slides[0]?.title, 'Title Slide');
  assert.deepEqual(slides[0]?.bullets, ['Welcome to Biology']);
  assert.equal(slides[1]?.title, 'Cell Structure');
  assert.deepEqual(slides[1]?.bullets, ['Nucleus', 'Membrane']);
  assert.equal(slides[2]?.kind, 'closing');
});

test('parseSlideOutlineMarkdown falls back to a single slide for plain text', () => {
  const slides = parseSlideOutlineMarkdown('One paragraph outline without headings.');
  assert.equal(slides.length, 1);
  assert.equal(slides[0]?.title, 'Presentation outline');
  assert.deepEqual(slides[0]?.bullets, ['One paragraph outline without headings.']);
});
