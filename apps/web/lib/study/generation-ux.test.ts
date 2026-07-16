import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSlideOutlineTitle,
  isStudySummaryTitle,
  studyGenerateButtonLabel,
  studyGenerateSourceDescription,
  studyGenerateStatusMessage,
} from './generation-ux';

test('detects study summary and slide outline titles', () => {
  assert.equal(isStudySummaryTitle('Study Summary: Biology'), true);
  assert.equal(isSlideOutlineTitle('Slide Outline: Biology'), true);
  assert.equal(isStudySummaryTitle('Slide Outline: Biology'), false);
  assert.equal(isSlideOutlineTitle('Study Summary: Biology'), false);
});

test('button labels switch between first generate and generate more', () => {
  assert.equal(studyGenerateButtonLabel('cards', false, false), 'Generate from source');
  assert.equal(studyGenerateButtonLabel('cards', false, true), 'Generate more cards');
  assert.equal(studyGenerateButtonLabel('cards', true, true), 'Generating cards…');
  assert.equal(studyGenerateButtonLabel('summary', false, true), 'Generate another summary');
  assert.equal(studyGenerateButtonLabel('quiz', false, true), 'Generate more questions');
});

test('status messages name the generation source', () => {
  const source = studyGenerateSourceDescription({
    generationSource: 'note',
    noteTitle: 'Cell Biology',
    transcriptName: null,
  });
  assert.equal(source, 'note “Cell Biology”');
  assert.match(studyGenerateStatusMessage('summary', source), /Cell Biology/);
});
