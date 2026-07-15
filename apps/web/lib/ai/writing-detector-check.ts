export type DetectorProvider = 'gptzero' | 'turnitin';

export type DetectorCheckResult = {
  provider: DetectorProvider;
  available: boolean;
  classification: string | null;
  aiProbability: number | null;
  averageGeneratedProb: number | null;
  confidence: string | null;
  message: string;
  flaggedSentences: Array<{ text: string; generatedProb: number }>;
  /** External free/manual check URL when in-app API is unavailable. */
  externalCheckUrl: string | null;
};

export const GPTZERO_FREE_CHECK_URL = 'https://gptzero.me/';

const MIN_CHARS = 50;
const MAX_CHARS = 50_000;

export function isGptZeroConfigured(): boolean {
  return Boolean(process.env.GPTZERO_API_KEY?.trim());
}

function clampText(text: string): string {
  return text.trim().slice(0, MAX_CHARS);
}

export function buildTurnitinUnavailableResult(): DetectorCheckResult {
  return {
    provider: 'turnitin',
    available: false,
    classification: null,
    aiProbability: null,
    averageGeneratedProb: null,
    confidence: null,
    message:
      'Turnitin has no public consumer API. Copy your draft and submit it through your school or institution Turnitin portal.',
    flaggedSentences: [],
    externalCheckUrl: null,
  };
}

export async function checkWithGptZero(textRaw: string): Promise<DetectorCheckResult> {
  const text = clampText(textRaw);
  if (text.length < MIN_CHARS) {
    throw new Error(`Enter at least ${MIN_CHARS} characters for a reliable detector check.`);
  }

  const apiKey = process.env.GPTZERO_API_KEY?.trim();
  if (!apiKey) {
    return {
      provider: 'gptzero',
      available: false,
      classification: null,
      aiProbability: null,
      averageGeneratedProb: null,
      confidence: null,
      message:
        'In-app GPTZero scores need a paid API key (not included on GPTZero free plans). Use the free GPTZero website: copy your text, paste it at gptzero.me, and review the report there.',
      flaggedSentences: [],
      externalCheckUrl: GPTZERO_FREE_CHECK_URL,
    };
  }

  const response = await fetch('https://api.gptzero.me/v2/predict/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ document: text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail.trim()
        ? `GPTZero check failed: ${detail.slice(0, 240)}`
        : `GPTZero check failed (${response.status})`,
    );
  }

  const payload = (await response.json()) as {
    documents?: Array<{
      completely_generated_prob?: number;
      average_generated_prob?: number;
      document_classification?: string;
      confidence_category?: string;
      class_probabilities?: { ai?: number; human?: number; mixed?: number };
      sentences?: Array<{
        sentence?: string;
        generated_prob?: number;
        highlight_sentence_for_ai?: boolean;
      }>;
    }>;
  };

  const doc = payload.documents?.[0];
  const aiProbability =
    typeof doc?.completely_generated_prob === 'number'
      ? doc.completely_generated_prob
      : typeof doc?.class_probabilities?.ai === 'number'
        ? doc.class_probabilities.ai
        : null;

  const flaggedSentences = (doc?.sentences ?? [])
    .filter((sentence) => sentence.highlight_sentence_for_ai)
    .map((sentence) => ({
      text: String(sentence.sentence ?? '').trim(),
      generatedProb: Number(sentence.generated_prob ?? 0),
    }))
    .filter((sentence) => sentence.text)
    .slice(0, 12);

  return {
    provider: 'gptzero',
    available: true,
    classification: doc?.document_classification ?? null,
    aiProbability,
    averageGeneratedProb:
      typeof doc?.average_generated_prob === 'number' ? doc.average_generated_prob : null,
    confidence: doc?.confidence_category ?? null,
    message:
      'Transparency check only. Detectors can be wrong — use the report to review your own work, not to evade integrity systems.',
    flaggedSentences,
    externalCheckUrl: GPTZERO_FREE_CHECK_URL,
  };
}
