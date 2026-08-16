export const LIVE_CONTEXT_PAGE_TEXT_MAX = 24_000;

export type LiveBrowserContextInput = {
  url?: unknown;
  title?: unknown;
  pageText?: unknown;
  /** Cursor-focused text (local node + parent wrapper). */
  activeHoverContext?: unknown;
  /** Alias used by context-stream clients. */
  fullPageContext?: unknown;
  capturedAt?: unknown;
  userQuery?: unknown;
};

export type SanitizedLiveBrowserContext = {
  url: string;
  title: string;
  pageText: string;
  activeHoverContext: string;
  capturedAt: string;
  userQuery: string;
  truncated: boolean;
};

function asTrimmedString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

/** Insert readable breaks into scraped page text (nav/run-on words, etc.). */
export function formatCapturedPageText(raw: string): string {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(
      /([^\s|•·\n])(Menu|About|Contact|Home|Blog|Pricing|Recipes|Order|Shop|Cart|Login|Sign|Gifting|New)/g,
      '$1\n$2',
    )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Turn captured page text into short bullet lines for the live-context preview. */
export function pageTextToPreviewBullets(pageText: string, limit = 18): string[] {
  const lines = pageText
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length >= 3);

  const bullets: string[] = [];
  for (const line of lines) {
    if (line.length <= 140) {
      bullets.push(line);
    } else {
      const sentences = line.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
      if (sentences.length > 1) {
        bullets.push(...sentences);
      } else {
        bullets.push(`${line.slice(0, 137).trim()}…`);
      }
    }
    if (bullets.length >= limit) {
      break;
    }
  }

  return bullets.slice(0, limit);
}

const HOVER_NODE_RE = /^\[Hover node:\s*([^\]]+)\]\s*$/i;
const HOVER_PARENT_RE = /^\[Parent \/ surrounding block\]\s*$/i;

export type ParsedHoverFocus = {
  tagName: string | null;
  primaryText: string;
  surroundingText: string;
};

/** Parse content-script hover prompt text into structured UI fields. */
export function parseHoverFocus(raw: string): ParsedHoverFocus {
  const source = (raw || '').trim();
  if (!source) {
    return { tagName: null, primaryText: '', surroundingText: '' };
  }

  // Read the hover-node line before formatCapturedPageText — that formatter
  // inserts spaces into tags like h2 → "h 2".
  const rawLines = source.split(/\n/).map((line) => line.trim());
  let tagName: string | null = null;
  for (const line of rawLines) {
    const nodeMatch = line.match(HOVER_NODE_RE);
    if (nodeMatch) {
      tagName = (nodeMatch[1] || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
      break;
    }
  }

  const text = formatCapturedPageText(source);
  const lines = text.split(/\n/).map((line) => line.trim());
  const primary: string[] = [];
  const surrounding: string[] = [];
  let mode: 'primary' | 'surrounding' = 'primary';

  for (const line of lines) {
    if (!line) {
      continue;
    }
    if (HOVER_NODE_RE.test(line) || /^\[Hover node:/i.test(line)) {
      continue;
    }
    if (HOVER_PARENT_RE.test(line)) {
      mode = 'surrounding';
      continue;
    }
    if (mode === 'primary') {
      primary.push(line);
    } else {
      surrounding.push(line);
    }
  }

  return {
    tagName,
    primaryText: primary.join('\n').trim(),
    surroundingText: surrounding.join('\n').trim(),
  };
}

const PAGE_CHROME_LINE_RE =
  /^(search|menu|home|about|contact|login|log in|sign in|sign up|create|settings|help|privacy|terms|cookie|subscribe|follow us|share|cart|shop|blog|pricing|take quizzes?|create a quiz|quiz mind map|study guide|start quiz|next|previous|skip|submit|continue|pre-?k|kindergarten|\d+(st|nd|rd|th)\s*grade|grade\s*\d+)$/i;

function isPageChromeLine(line: string): boolean {
  const cleaned = line.replace(/^[-•*\d.)\s]+/, '').trim();
  if (cleaned.length < 4) {
    return true;
  }
  if (cleaned.length <= 28 && PAGE_CHROME_LINE_RE.test(cleaned)) {
    return true;
  }
  if (/^(pre-?k|k|\d{1,2}(st|nd|rd|th)?)$/i.test(cleaned)) {
    return true;
  }
  return false;
}

function scoreContentLine(line: string): number {
  let score = Math.min(line.length, 160) / 20;
  if (/\?$/.test(line) || /^\d+[\).:]/.test(line)) {
    score += 8;
  }
  if (/\b(quiz|question|characteristic|organism|definition|explain|choose|select)\b/i.test(line)) {
    score += 4;
  }
  if (line.length > 60) {
    score += 3;
  }
  if (isPageChromeLine(line)) {
    return -10;
  }
  return score;
}

export type PageSnapshotSummary = {
  /** 1–3 sentence overview of what the page is about. */
  summary: string;
  /** Substantive highlights (questions, claims) — not chrome/nav. */
  highlights: string[];
};

/**
 * Build a human-readable “what this page is about” snapshot from title + scraped text.
 * Filters common chrome/nav noise that otherwise dominates bullet previews.
 */
export function summarizePageSnapshot(
  pageText: string,
  title = '',
  options?: { highlightLimit?: number },
): PageSnapshotSummary {
  const highlightLimit = options?.highlightLimit ?? 6;
  const cleanedTitle = formatCapturedPageText(title).replace(/\s*[|\-–—].*$/, '').trim();
  const lines = formatCapturedPageText(pageText)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length >= 8 && !isPageChromeLine(line));

  const ranked = [...lines]
    .map((line) => ({
      line: line.length > 180 ? `${line.slice(0, 177).trim()}…` : line,
      score: scoreContentLine(line),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const highlights: string[] = [];
  const seen = new Set<string>();
  for (const entry of ranked) {
    const key = entry.line.toLowerCase().slice(0, 48);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    highlights.push(entry.line);
    if (highlights.length >= highlightLimit) {
      break;
    }
  }

  const lead =
    cleanedTitle && !/^untitled/i.test(cleanedTitle)
      ? cleanedTitle
      : highlights[0]?.replace(/\?$/, '') || 'This page';

  const topicBits = highlights
    .slice(0, 3)
    .map((item) => item.replace(/^\d+[\).:]\s*/, '').trim())
    .filter((item) => item.toLowerCase() !== lead.toLowerCase());

  let summary: string;
  if (!highlights.length) {
    summary = cleanedTitle
      ? `${cleanedTitle} — limited readable body text was captured from this tab.`
      : 'No readable page content was captured yet.';
  } else if (topicBits.length === 0) {
    summary = `${lead}.`;
  } else if (/\bquiz\b|\btest\b|\bquestion\b/i.test(`${lead} ${topicBits.join(' ')}`)) {
    summary = `${lead} covers topics such as ${topicBits
      .slice(0, 2)
      .map((bit) => (bit.endsWith('?') ? bit.slice(0, -1) : bit))
      .join('; ')
      .toLowerCase()}.`;
  } else {
    summary = `${lead}. Key content includes: ${topicBits
      .slice(0, 2)
      .map((bit) => (bit.length > 90 ? `${bit.slice(0, 87)}…` : bit))
      .join(' · ')}.`;
  }

  // Keep summary concise for the side panel.
  if (summary.length > 320) {
    summary = `${summary.slice(0, 317).trim()}…`;
  }

  return { summary, highlights };
}

/** Strip password-field-like lines and collapse whitespace before truncation. */
export function redactSensitivePageText(raw: string): string {
  return formatCapturedPageText(
    raw
      .split('\n')
      .filter((line) => {
        const lower = line.toLowerCase();
        if (/\bpassword\b/.test(lower) && line.length < 120) {
          return false;
        }
        if (/\b(credit\s*card|ssn|social security)\b/.test(lower) && line.length < 160) {
          return false;
        }
        return true;
      })
      .join('\n'),
  );
}

export function sanitizeLiveBrowserContext(
  input: LiveBrowserContextInput,
  options?: { maxPageText?: number },
): { ok: true; context: SanitizedLiveBrowserContext } | { ok: false; error: string } {
  const userQuery = asTrimmedString(input.userQuery);
  if (!userQuery) {
    return { ok: false, error: 'userQuery is required' };
  }
  if (userQuery.length > 4_000) {
    return { ok: false, error: 'userQuery is too long' };
  }

  const url = asTrimmedString(input.url);
  if (!url) {
    return { ok: false, error: 'url is required' };
  }
  if (url.length > 2_048) {
    return { ok: false, error: 'url is too long' };
  }

  const title = asTrimmedString(input.title, 'Untitled page').slice(0, 500);
  const maxPageText = options?.maxPageText ?? LIVE_CONTEXT_PAGE_TEXT_MAX;
  const pageTextRaw = asTrimmedString(input.pageText) || asTrimmedString(input.fullPageContext);
  const redacted = redactSensitivePageText(pageTextRaw);
  if (!redacted) {
    return { ok: false, error: 'pageText is required' };
  }

  const truncated = redacted.length > maxPageText;
  const pageText = truncated ? `${redacted.slice(0, maxPageText)}\n\n[…truncated]` : redacted;
  const activeHoverContext = formatCapturedPageText(
    asTrimmedString(input.activeHoverContext),
  ).slice(0, 4_000);

  const capturedAtRaw = asTrimmedString(input.capturedAt);
  const capturedAtDate = capturedAtRaw ? new Date(capturedAtRaw) : new Date();
  if (Number.isNaN(capturedAtDate.getTime())) {
    return { ok: false, error: 'capturedAt must be a valid ISO-8601 timestamp' };
  }

  return {
    ok: true,
    context: {
      url,
      title,
      pageText,
      activeHoverContext,
      capturedAt: capturedAtDate.toISOString(),
      userQuery,
      truncated,
    },
  };
}

export function buildLiveContextSystemPrompt(context: SanitizedLiveBrowserContext): string {
  const hoverBlock = context.activeHoverContext
    ? [
        'CURSOR FOCUS (highest priority — the user is pointing at this text right now):',
        context.activeHoverContext,
        '',
      ]
    : [
        'CURSOR FOCUS: none captured. Answer from the full-page background text below.',
        '',
      ];

  return [
    'You are Aproko AI, a live browser-context assistant with cursor awareness.',
    'Treat the CURSOR FOCUS block as the primary subject of the user question.',
    'Use FULL PAGE BACKGROUND only as supporting context (definitions, nearby questions, headings).',
    'If cursor focus and page background conflict, prefer cursor focus and mention the ambiguity.',
    'If the extracted text is incomplete or ambiguous, say what is missing.',
    'Do not invent page content that is not present in the context.',
    'Do not claim citations from workspace sources unless they appear in additional context.',
    '',
    `[Current URL]: ${context.url}`,
    `[Page Title]: ${context.title}`,
    `[Captured At]: ${context.capturedAt}`,
    context.truncated ? '[Note]: Page text was truncated for size limits.' : null,
    '',
    ...hoverBlock,
    'FULL PAGE BACKGROUND:',
    context.pageText,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}
