export const PENDING_DELETE_MS = 5000;

export type PendingDeleteJob<T> = {
  id: string;
  targets: T[];
};

export function createPendingJobId(nowMs = Date.now(), randomValue = Math.random()): string {
  return `${nowMs}-${Math.floor(randomValue * 1_000_000)
    .toString(16)
    .padStart(5, '0')}`;
}

export function removeByIds<T extends { id: string }>(items: T[], idsToRemove: string[]): T[] {
  const idSet = new Set(idsToRemove);
  return items.filter((item) => !idSet.has(item.id));
}

export function upsertIds(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming]));
}

export function subtractIds(existing: string[], idsToRemove: string[]): string[] {
  const removeSet = new Set(idsToRemove);
  return existing.filter((id) => !removeSet.has(id));
}

export function isPendingJobActive(
  jobId: string,
  currentJobId: string | null | undefined,
): boolean {
  return !!currentJobId && currentJobId === jobId;
}
