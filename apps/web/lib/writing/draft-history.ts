const STORAGE_KEY = 'aproko.writing.drafts.v1';
const MIGRATED_KEY = 'aproko.writing.drafts.migrated.v1';

export type WritingDraftRecord = {
  id: string;
  title: string;
  draft: string;
  polished: string;
  mode: string;
  updatedAt: string;
  createdAt?: string;
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listLocalWritingDrafts(): WritingDraftRecord[] {
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

/** @deprecated Prefer listLocalWritingDrafts — kept for any residual callers. */
export function listWritingDrafts(): WritingDraftRecord[] {
  return listLocalWritingDrafts();
}

export function clearLocalWritingDrafts(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasMigratedLocalWritingDrafts(): boolean {
  if (!canUseStorage()) {
    return true;
  }
  return window.localStorage.getItem(MIGRATED_KEY) === '1';
}

export function markLocalWritingDraftsMigrated(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(MIGRATED_KEY, '1');
  clearLocalWritingDrafts();
}

export function deriveWritingTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'Untitled draft';
  }
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}
