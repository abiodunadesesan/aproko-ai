import { generateText } from 'ai';
import { isModelConfigured, resolveLanguageModel } from '@/lib/ai/chat-models';

const STUDY_MODEL = 'openai:gpt-4o-mini' as const;
const MAX_SOURCE_CHARS = 14_000;

export type FlashcardDraft = { question: string; answer: string };
export type QuizQuestionDraft = {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
};

function truncateSource(sourceText: string): string {
  const trimmed = sourceText.trim();
  if (trimmed.length <= MAX_SOURCE_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated for generation length.]`;
}

function sentenceParts(text: string): string[] {
  return text
    .split(/[.\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 24);
}

export function heuristicStudySummary(sourceText: string): string {
  const sentences = sentenceParts(sourceText);
  const overview = sentences.slice(0, 2);
  const keyPoints = sentences.slice(2, 6);
  const lines: string[] = [
    '## Overview',
    overview.length ? `${overview.join('. ')}.` : 'Study source captured.',
    '',
    '## Key Points',
  ];
  if (keyPoints.length) {
    for (const point of keyPoints) {
      lines.push(`- ${point}`);
    }
  } else {
    lines.push('- Add more detailed notes to improve summary quality.');
  }
  lines.push('', '## Next Review');
  lines.push('- Revisit this summary and convert key points into flashcards.');
  lines.push('- Validate understanding with a short quiz attempt.');
  return lines.join('\n');
}

export function heuristicSlideOutline(sourceText: string): string {
  const sentences = sentenceParts(sourceText).slice(0, 8);
  const lines = ['# Slide Outline', '', '## Title Slide', '- Topic overview', ''];
  sentences.forEach((sentence, index) => {
    lines.push(`## Slide ${index + 1}`);
    lines.push(`- ${sentence}`);
    lines.push('');
  });
  if (sentences.length === 0) {
    lines.push('## Slide 1');
    lines.push('- Capture more source content to build slides.');
  }
  lines.push('## Closing');
  lines.push('- Key takeaways');
  lines.push('- Questions / next steps');
  return lines.join('\n');
}

export function heuristicFlashcards(sourceText: string): FlashcardDraft[] {
  return sentenceParts(sourceText)
    .slice(0, 6)
    .map((segment, index) => ({
      question: `Flashcard ${index + 1}: What is a key point from this material?`,
      answer: segment,
    }));
}

export function heuristicQuizQuestions(sourceText: string): QuizQuestionDraft[] {
  return sentenceParts(sourceText)
    .slice(0, 5)
    .map((sentence, index) => ({
      prompt: `Q${index + 1}. Which option best matches this point?`,
      options: [
        sentence,
        'This statement is unrelated to the source',
        'No relevant point was captured',
        'The source did not mention this topic',
      ],
      correctOptionIndex: 0,
      explanation: 'Matches the source material.',
    }));
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return JSON');
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

export async function generateStudySummaryMarkdown(sourceText: string): Promise<string> {
  const source = truncateSource(sourceText);
  if (!source) {
    throw new Error('Source content is empty');
  }
  if (!isModelConfigured(STUDY_MODEL)) {
    return heuristicStudySummary(source);
  }

  const result = await generateText({
    model: resolveLanguageModel(STUDY_MODEL),
    system:
      'You are Aproko AI study assistant. Write a concise markdown study summary with sections: Overview, Key Points, Definitions, Next Review. Do not invent citations.',
    prompt: `Create a study summary from this source:\n\n${source}`,
  });
  return result.text.trim() || heuristicStudySummary(source);
}

export async function generateSlideOutlineMarkdown(sourceText: string): Promise<string> {
  const source = truncateSource(sourceText);
  if (!source) {
    throw new Error('Source content is empty');
  }
  if (!isModelConfigured(STUDY_MODEL)) {
    return heuristicSlideOutline(source);
  }

  const result = await generateText({
    model: resolveLanguageModel(STUDY_MODEL),
    system:
      'You are Aproko AI slide planner. Produce a markdown slide outline with a Title Slide, 4-8 content slides (## headings + bullet points), and a Closing slide. Keep bullets short.',
    prompt: `Build a presentation outline from this source:\n\n${source}`,
  });
  return result.text.trim() || heuristicSlideOutline(source);
}

export async function generateFlashcardDrafts(sourceText: string): Promise<FlashcardDraft[]> {
  const source = truncateSource(sourceText);
  if (!source) {
    throw new Error('Source content is empty');
  }
  if (!isModelConfigured(STUDY_MODEL)) {
    return heuristicFlashcards(source);
  }

  const result = await generateText({
    model: resolveLanguageModel(STUDY_MODEL),
    system:
      'Return ONLY JSON: {"cards":[{"question":"...","answer":"..."}]}. Create 5-8 high-quality flashcards grounded in the source.',
    prompt: source,
  });

  try {
    const parsed = extractJsonObject(result.text) as { cards?: FlashcardDraft[] };
    const cards = (parsed.cards ?? [])
      .map((card) => ({
        question: String(card.question ?? '').trim(),
        answer: String(card.answer ?? '').trim(),
      }))
      .filter((card) => card.question && card.answer)
      .slice(0, 10);
    return cards.length ? cards : heuristicFlashcards(source);
  } catch {
    return heuristicFlashcards(source);
  }
}

export async function generateQuizQuestionDrafts(sourceText: string): Promise<QuizQuestionDraft[]> {
  const source = truncateSource(sourceText);
  if (!source) {
    throw new Error('Source content is empty');
  }
  if (!isModelConfigured(STUDY_MODEL)) {
    return heuristicQuizQuestions(source);
  }

  const result = await generateText({
    model: resolveLanguageModel(STUDY_MODEL),
    system:
      'Return ONLY JSON: {"questions":[{"prompt":"...","options":["A","B","C","D"],"correctOptionIndex":0,"explanation":"..."}]}. Create 4-6 multiple-choice questions grounded in the source. correctOptionIndex must be 0-3.',
    prompt: source,
  });

  try {
    const parsed = extractJsonObject(result.text) as { questions?: QuizQuestionDraft[] };
    const questions = (parsed.questions ?? [])
      .map((question) => {
        const options = Array.isArray(question.options)
          ? question.options.map((option) => String(option).trim()).filter(Boolean)
          : [];
        const correctOptionIndex = Number(question.correctOptionIndex);
        const explanation = question.explanation ? String(question.explanation).trim() : undefined;
        const draft: QuizQuestionDraft = {
          prompt: String(question.prompt ?? '').trim(),
          options: options.slice(0, 4),
          correctOptionIndex:
            Number.isInteger(correctOptionIndex) &&
            correctOptionIndex >= 0 &&
            correctOptionIndex < 4
              ? correctOptionIndex
              : 0,
        };
        if (explanation) {
          draft.explanation = explanation;
        }
        return draft;
      })
      .filter((question) => question.prompt && question.options.length >= 2)
      .slice(0, 8);
    return questions.length ? questions : heuristicQuizQuestions(source);
  } catch {
    return heuristicQuizQuestions(source);
  }
}
