import { generateText } from 'ai';
import { isModelConfigured, resolveLanguageModel } from '@/lib/ai/chat-models';

const POLISH_MODEL = 'openai:gpt-4o-mini' as const;
const MAX_INPUT_CHARS = 12_000;

export const WRITING_POLISH_MODES = ['clarity', 'concise', 'professional', 'academic'] as const;

export type WritingPolishMode = (typeof WRITING_POLISH_MODES)[number];

export function isWritingPolishMode(value: string): value is WritingPolishMode {
  return (WRITING_POLISH_MODES as readonly string[]).includes(value);
}

const MODE_INSTRUCTIONS: Record<WritingPolishMode, string> = {
  clarity:
    'Improve clarity and flow. Fix awkward phrasing, tighten sentences, and keep the original meaning.',
  concise: 'Make the writing more concise while preserving meaning and important details.',
  professional:
    'Rewrite in a clear professional tone suitable for workplace documents. Keep meaning intact.',
  academic:
    'Rewrite in a clear academic tone suitable for studying and coursework. Keep meaning intact. Do not add fake citations.',
};

function lightHeuristicPolish(text: string, mode: WritingPolishMode): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }

  if (mode === 'concise') {
    return cleaned
      .replace(/\b(really|very|basically|actually|just)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return cleaned;
}

export async function polishWriting(input: {
  text: string;
  mode: WritingPolishMode;
}): Promise<{ polished: string; mode: WritingPolishMode }> {
  const text = input.text.trim();
  if (!text) {
    throw new Error('Text is required');
  }

  const truncated =
    text.length > MAX_INPUT_CHARS
      ? `${text.slice(0, MAX_INPUT_CHARS)}\n\n[Input truncated for length.]`
      : text;

  if (!isModelConfigured(POLISH_MODEL)) {
    return {
      polished: lightHeuristicPolish(truncated, input.mode),
      mode: input.mode,
    };
  }

  const result = await generateText({
    model: resolveLanguageModel(POLISH_MODEL),
    system: [
      'You are Aproko AI writing assistant.',
      'Improve the user draft for readability and tone.',
      MODE_INSTRUCTIONS[input.mode],
      "Preserve the author's intent and factual content.",
      'Return ONLY the revised text with no preamble.',
      'Never claim to bypass plagiarism detectors, Turnitin, GPTZero, or similar tools.',
      'Do not restructure text specifically to evade AI-detection systems.',
    ].join(' '),
    prompt: truncated,
  });

  const polished = result.text.trim() || lightHeuristicPolish(truncated, input.mode);
  return { polished, mode: input.mode };
}
