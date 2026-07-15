const STORAGE_KEY = 'aproko.writing.drafts.v1';

export type WritingDraftRecord = {
  id: string;
  title: string;
  draft: string;
  polished: string;
  mode: string;
  updatedAt: string;
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listWritingDrafts(): WritingDraftRecord[] {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WritingDraftRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item.id === 'string')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function persist(drafts: WritingDraftRecord[]): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.slice(0, 40)));
}

export function upsertWritingDraft(
  input: Omit<WritingDraftRecord, 'updatedAt'> & { updatedAt?: string },
): WritingDraftRecord {
  const record: WritingDraftRecord = {
    ...input,
    title: input.title.trim() || 'Untitled draft',
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  const existing = listWritingDrafts().filter((item) => item.id !== record.id);
  persist([record, ...existing]);
  return record;
}

export function deleteWritingDraft(id: string): void {
  persist(listWritingDrafts().filter((item) => item.id !== id));
}

export function createWritingDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}`;
}

export function deriveWritingTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'Untitled draft';
  }
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}
