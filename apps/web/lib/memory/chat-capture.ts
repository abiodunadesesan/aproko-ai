import type { MemoryType } from '@/lib/storage/memory';

export type ChatMemoryCandidate = {
  memoryType: MemoryType;
  summary: string;
  explicit: boolean;
  importanceScore: number;
  confidenceScore: number;
};

function cleanSummary(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!]+$/, '');
}

/**
 * Detect memory-worthy lines in a user chat message.
 * - explicit: "remember that/this/..." always eligible
 * - auto: preference/fact phrasing only when autoMemoryCapture is enabled
 */
export function detectChatMemoryCandidates(content: string): ChatMemoryCandidate[] {
  const text = content.trim();
  if (!text) {
    return [];
  }

  const candidates: ChatMemoryCandidate[] = [];
  const seen = new Set<string>();

  const push = (candidate: ChatMemoryCandidate) => {
    const key = `${candidate.memoryType}:${candidate.summary.toLowerCase()}`;
    if (!candidate.summary || seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push(candidate);
  };

  const rememberMatch = text.match(/(?:please\s+)?remember(?:\s+that|\s+this|\s+I)?[:\s]+(.+)$/i);
  if (rememberMatch?.[1]) {
    const summary = cleanSummary(rememberMatch[1]);
    if (summary.length >= 3) {
      push({
        memoryType: 'fact',
        summary,
        explicit: true,
        importanceScore: 0.85,
        confidenceScore: 0.9,
      });
    }
  }

  const preferMatch = text.match(/\bI\s+prefer\s+(.+)$/i);
  if (preferMatch?.[1]) {
    const summary = cleanSummary(`Prefers ${preferMatch[1]}`);
    if (summary.length >= 8) {
      push({
        memoryType: 'preference',
        summary,
        explicit: false,
        importanceScore: 0.7,
        confidenceScore: 0.75,
      });
    }
  }

  const nameMatch = text.match(/\b(?:my name is|I am|I'm)\s+([A-Z][\w'-]{1,40})\b/);
  if (nameMatch?.[1] && !/^(a|an|the|not|going|trying)$/i.test(nameMatch[1])) {
    push({
      memoryType: 'fact',
      summary: `Name is ${nameMatch[1]}`,
      explicit: false,
      importanceScore: 0.65,
      confidenceScore: 0.7,
    });
  }

  const alwaysMatch = text.match(/\bI\s+always\s+(.+)$/i);
  if (alwaysMatch?.[1]) {
    const summary = cleanSummary(`Always ${alwaysMatch[1]}`);
    if (summary.length >= 10) {
      push({
        memoryType: 'preference',
        summary,
        explicit: false,
        importanceScore: 0.7,
        confidenceScore: 0.7,
      });
    }
  }

  return candidates.slice(0, 3);
}

export function selectChatMemoryCandidates(
  content: string,
  autoMemoryCapture: boolean,
): ChatMemoryCandidate[] {
  return detectChatMemoryCandidates(content).filter(
    (candidate) => candidate.explicit || autoMemoryCapture,
  );
}

export type CaptureChatMemoriesInput = {
  workspaceId: string;
  messageId: string;
  content: string;
  autoMemoryCapture: boolean;
  createMemoryItem: (
    workspaceId: string,
    memoryType: MemoryType,
    summary: string,
    importanceScore: number | null,
    confidenceScore: number | null,
    state: 'active',
    references?: { messageIds: string[] },
  ) => Promise<unknown>;
};

export async function captureChatMemoriesFromMessage(
  input: CaptureChatMemoriesInput,
): Promise<number> {
  const candidates = selectChatMemoryCandidates(input.content, input.autoMemoryCapture);
  if (candidates.length === 0) {
    return 0;
  }

  let created = 0;
  for (const candidate of candidates) {
    try {
      const item = await input.createMemoryItem(
        input.workspaceId,
        candidate.memoryType,
        candidate.summary,
        candidate.importanceScore,
        candidate.confidenceScore,
        'active',
        { messageIds: [input.messageId] },
      );
      if (item) {
        created += 1;
      }
    } catch (error) {
      console.warn('Unable to capture chat memory candidate.', error);
    }
  }

  return created;
}
