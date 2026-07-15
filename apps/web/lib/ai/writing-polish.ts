import { generateText } from 'ai';
import {
  getConfiguredChatModels,
  resolveLanguageModel,
  type ChatModel,
} from '@/lib/ai/chat-models';

const MAX_INPUT_CHARS = 12_000;

/** Prefer free/fast providers first, then paid ones. */
const POLISH_MODEL_PREFERENCE: ChatModel[] = [
  'groq:llama-3.1-8b-instant',
  'google:gemini-3.5-flash',
  'openai:gpt-4o-mini',
  'anthropic:claude-sonnet-5',
];

export const WRITING_POLISH_MODES = ['clarity', 'concise', 'professional', 'academic'] as const;

export type WritingPolishMode = (typeof WRITING_POLISH_MODES)[number];

export function isWritingPolishMode(value: string): value is WritingPolishMode {
  return (WRITING_POLISH_MODES as readonly string[]).includes(value);
}

function resolvePolishModels(): ChatModel[] {
  const configured = new Set(getConfiguredChatModels());
  return POLISH_MODEL_PREFERENCE.filter((model) => configured.has(model));
}

function isRetryableProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /quota|billing|credits|rate limit|429|402|401|403|invalid api key|insufficient/i.test(
    message,
  );
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
}): Promise<{ polished: string; mode: WritingPolishMode; engine: 'llm' | 'heuristic' }> {
  const text = input.text.trim();
  if (!text) {
    throw new Error('Text is required');
  }

  const truncated =
    text.length > MAX_INPUT_CHARS
      ? `${text.slice(0, MAX_INPUT_CHARS)}\n\n[Input truncated for length.]`
      : text;

  const polishModels = resolvePolishModels();
  if (polishModels.length === 0) {
    return {
      polished: lightHeuristicPolish(truncated, input.mode),
      mode: input.mode,
      engine: 'heuristic',
    };
  }

  const system = [
    'You are Aproko AI writing assistant.',
    'Improve the user draft for readability and tone.',
    MODE_INSTRUCTIONS[input.mode],
    "Preserve the author's intent and factual content.",
    'Return ONLY the revised text with no preamble.',
    'Make meaningful improvements — do not return the input unchanged unless it is already excellent.',
    'Never claim to bypass plagiarism detectors, Turnitin, GPTZero, or similar tools.',
    'Do not restructure text specifically to evade AI-detection systems.',
  ].join(' ');

  let lastError: unknown;
  for (const polishModel of polishModels) {
    try {
      const result = await generateText({
        model: resolveLanguageModel(polishModel),
        system,
        prompt: truncated,
        maxRetries: 0,
      });

      const polished = result.text.trim() || lightHeuristicPolish(truncated, input.mode);
      return { polished, mode: input.mode, engine: 'llm' };
    } catch (error) {
      lastError = error;
      if (!isRetryableProviderError(error)) {
        throw error;
      }
    }
  }

  console.warn('All polish providers failed; falling back to heuristic', lastError);
  return {
    polished: lightHeuristicPolish(truncated, input.mode),
    mode: input.mode,
    engine: 'heuristic',
  };
}
