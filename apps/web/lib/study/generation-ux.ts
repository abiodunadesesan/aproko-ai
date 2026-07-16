export type StudyGenerateAction = 'summary' | 'outline' | 'cards' | 'quiz';

export function isStudySummaryTitle(title: string): boolean {
  return title.trim().toLowerCase().startsWith('study summary');
}

export function isSlideOutlineTitle(title: string): boolean {
  return title.trim().toLowerCase().startsWith('slide outline');
}

export function studyGenerateIdleLabel(action: StudyGenerateAction, hasExisting: boolean): string {
  switch (action) {
    case 'summary':
      return hasExisting ? 'Generate another summary' : 'Generate Summary';
    case 'outline':
      return hasExisting ? 'Generate another outline' : 'Generate Slide Outline';
    case 'cards':
      return hasExisting ? 'Generate more cards' : 'Generate from source';
    case 'quiz':
      return hasExisting ? 'Generate more questions' : 'Generate from source';
  }
}

export function studyGenerateBusyLabel(action: StudyGenerateAction): string {
  switch (action) {
    case 'summary':
      return 'Generating summary…';
    case 'outline':
      return 'Generating outline…';
    case 'cards':
      return 'Generating cards…';
    case 'quiz':
      return 'Generating questions…';
  }
}

export function studyGenerateButtonLabel(
  action: StudyGenerateAction,
  isGenerating: boolean,
  hasExisting: boolean,
): string {
  return isGenerating
    ? studyGenerateBusyLabel(action)
    : studyGenerateIdleLabel(action, hasExisting);
}

export function studyGenerateStatusMessage(
  action: StudyGenerateAction,
  sourceDescription: string,
): string {
  switch (action) {
    case 'summary':
      return `Generating study summary from ${sourceDescription}…`;
    case 'outline':
      return `Generating slide outline from ${sourceDescription}…`;
    case 'cards':
      return `Generating flashcards from ${sourceDescription}…`;
    case 'quiz':
      return `Generating quiz questions from ${sourceDescription}…`;
  }
}

export function studyGenerateSourceDescription(input: {
  generationSource: 'note' | 'transcript';
  noteTitle: string | null;
  transcriptName: string | null;
}): string {
  if (input.generationSource === 'transcript') {
    return input.transcriptName ? `transcript “${input.transcriptName}”` : 'selected transcript';
  }

  return input.noteTitle ? `note “${input.noteTitle}”` : 'active note';
}
