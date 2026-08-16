import { generateText } from 'ai';
import { formatGenerationError } from '@/lib/ai/chat-generation';
import { resolveLanguageModel, type ChatModel } from '@/lib/ai/chat-models';
import {
  buildLiveContextSystemPrompt,
  type SanitizedLiveBrowserContext,
} from '@/lib/live-context/sanitize';

export type LiveSolveResult = {
  kind: 'mcq' | 'short' | 'explain';
  optionKey: string | null;
  optionText: string | null;
  fillText: string | null;
  explanation: string;
};

function buildSolveUserPrompt(userQuery: string): string {
  return [
    userQuery.trim() ||
      'The user clicked this question/prompt. Using the full page and cursor focus, solve it.',
    '',
    'Respond with ONLY valid JSON (no markdown fences) matching:',
    '{',
    '  "kind": "mcq" | "short" | "explain",',
    '  "optionKey": "A"|"B"|"C"|"D"|null,',
    '  "optionText": string|null,',
    '  "fillText": string|null,',
    '  "explanation": string',
    '}',
    '',
    'Rules:',
    '- kind=mcq when choices A/B/C/D (or 1/2/3/4) are present; set optionKey to the best choice letter/number.',
    '- kind=short when a free-text / blank answer is needed; put the answer in fillText.',
    '- kind=explain when neither applies; put guidance in explanation.',
    '- Prefer evidence from CURSOR FOCUS, then FULL PAGE BACKGROUND.',
    '- Keep explanation to 1-3 short sentences.',
  ].join('\n');
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('Model did not return JSON');
  }
}

function normalizeSolveResult(value: unknown): LiveSolveResult {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const kindRaw = typeof obj.kind === 'string' ? obj.kind.toLowerCase() : 'explain';
  const kind: LiveSolveResult['kind'] =
    kindRaw === 'mcq' || kindRaw === 'short' || kindRaw === 'explain' ? kindRaw : 'explain';

  const optionKey =
    typeof obj.optionKey === 'string' && obj.optionKey.trim()
      ? obj.optionKey.trim().toUpperCase().slice(0, 4)
      : null;
  const optionText =
    typeof obj.optionText === 'string' && obj.optionText.trim() ? obj.optionText.trim() : null;
  const fillText =
    typeof obj.fillText === 'string' && obj.fillText.trim() ? obj.fillText.trim() : null;
  const explanation =
    typeof obj.explanation === 'string' && obj.explanation.trim()
      ? obj.explanation.trim()
      : fillText || optionText || 'No explanation provided.';

  return { kind, optionKey, optionText, fillText, explanation };
}

export async function generateLiveSolve(input: {
  model: ChatModel;
  context: SanitizedLiveBrowserContext;
}): Promise<LiveSolveResult> {
  try {
    const result = await generateText({
      model: resolveLanguageModel(input.model),
      system: [
        buildLiveContextSystemPrompt(input.context),
        '',
        'You are helping the user answer the clicked question on screen.',
        'Read the entire page background so you understand the quiz/test as a whole.',
        'Output JSON only.',
      ].join('\n'),
      prompt: buildSolveUserPrompt(input.context.userQuery),
      temperature: 0.2,
    });

    return normalizeSolveResult(extractJsonObject(result.text));
  } catch (error) {
    throw formatGenerationError(error);
  }
}
