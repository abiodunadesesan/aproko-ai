'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { Copy, History, Pencil, PenLine, Plus, ScanSearch, Sparkles, Trash2 } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { AppReveal } from '@/components/app/app-motion';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  clearLocalWritingDrafts,
  deriveWritingTitle,
  hasMigratedLocalWritingDrafts,
  listLocalWritingDrafts,
  markLocalWritingDraftsMigrated,
  type WritingDraftRecord,
} from '@/lib/writing/draft-history';
import { cn } from '@/lib/utils';

const MODES = [
  { value: 'clarity', label: 'Clarity' },
  { value: 'concise', label: 'Concise' },
  { value: 'professional', label: 'Professional' },
  { value: 'academic', label: 'Academic' },
] as const;

type PolishMode = (typeof MODES)[number]['value'];

type DetectorCheckResult = {
  provider: 'gptzero' | 'turnitin';
  available: boolean;
  classification: string | null;
  aiProbability: number | null;
  averageGeneratedProb: number | null;
  confidence: string | null;
  message: string;
  flaggedSentences: Array<{ text: string; generatedProb: number }>;
  externalCheckUrl: string | null;
};

const GPTZERO_FREE_CHECK_URL = 'https://gptzero.me/';

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value * 100)}%`;
}

async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const raw = await response.text();
  const looksLikeHtml =
    raw.trimStart().startsWith('<!DOCTYPE') ||
    raw.trimStart().startsWith('<html') ||
    contentType.includes('text/html');

  if (looksLikeHtml || response.redirected) {
    throw new Error('You need to sign in again. Open /sign-in, then retry on Writing.');
  }

  if (!raw.trim()) {
    throw new Error(`Empty response (${response.status}). Try refreshing the page.`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      `Unexpected server response (${response.status}). Sign in again if this persists.`,
    );
  }
}

function toDraftRecord(payload: {
  id: string;
  title: string;
  draft: string;
  polished: string;
  mode: string;
  updatedAt: string;
  createdAt?: string;
}): WritingDraftRecord {
  return {
    id: payload.id,
    title: payload.title,
    draft: payload.draft,
    polished: payload.polished,
    mode: payload.mode,
    updatedAt: payload.updatedAt,
    ...(payload.createdAt !== undefined ? { createdAt: payload.createdAt } : {}),
  };
}

function DraftListItem({
  item,
  isActive,
  onLoad,
  onDelete,
  touchFriendly = false,
}: {
  item: WritingDraftRecord;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  touchFriendly?: boolean;
}) {
  return (
    <li>
      <div
        className={cn(
          'group flex items-start gap-1 rounded-xl px-2.5 py-2 transition-colors',
          isActive
            ? 'bg-zinc-100/90 ring-1 ring-zinc-200/80 dark:bg-zinc-800/70 dark:ring-zinc-700'
            : 'hover:bg-zinc-50/90 dark:hover:bg-zinc-900/70',
        )}
      >
        <button
          className={cn('min-w-0 flex-1 text-left', touchFriendly && 'min-h-11')}
          onClick={onLoad}
          type="button"
        >
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.title}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {new Date(item.updatedAt).toLocaleString()}
          </p>
        </button>
        <Button
          aria-label={`Delete ${item.title}`}
          className={cn(
            'text-destructive',
            touchFriendly ? 'h-9 w-9' : 'h-9 w-9 sm:h-7 sm:w-7',
          )}
          onClick={onDelete}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function DraftsPanelBody({
  drafts,
  draftId,
  isLoadingDrafts,
  isSaving,
  onNew,
  onSave,
  onLoad,
  onDelete,
  touchFriendly = false,
}: {
  drafts: WritingDraftRecord[];
  draftId: string | null;
  isLoadingDrafts: boolean;
  isSaving: boolean;
  onNew: () => void;
  onSave: () => void;
  onLoad: (item: WritingDraftRecord) => void;
  onDelete: (id: string) => void;
  touchFriendly?: boolean;
}) {
  return (
    <>
      <div className="space-y-2.5 border-b border-zinc-100 p-4 dark:border-zinc-800/80">
        <Button className="w-full rounded-xl" onClick={onNew} type="button">
          <Plus className="mr-1.5 h-4 w-4" />
          New draft
        </Button>
        <Button
          className="w-full rounded-xl"
          disabled={isSaving}
          onClick={onSave}
          type="button"
          variant="outline"
        >
          {isSaving ? 'Saving…' : 'Save current'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingDrafts ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-500" role="status">
            Loading drafts…
          </p>
        ) : drafts.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-500">
            No drafts yet — polish or save to keep work across devices.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {drafts.map((item) => (
              <DraftListItem
                isActive={item.id === draftId}
                item={item}
                key={item.id}
                onDelete={() => onDelete(item.id)}
                onLoad={() => onLoad(item)}
                touchFriendly={touchFriendly}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function WritingPage() {
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const draftsApi = workspaceId ? `/api/v1/workspaces/${workspaceId}/writing/drafts` : null;
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('Untitled draft');
  const [drafts, setDrafts] = useState<WritingDraftRecord[]>([]);
  const [draft, setDraft] = useState('');
  const [polished, setPolished] = useState('');
  const [mode, setMode] = useState<PolishMode>('clarity');
  const [checkTarget, setCheckTarget] = useState<'draft' | 'polished'>('draft');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gptzero, setGptzero] = useState<DetectorCheckResult | null>(null);
  const [turnitin, setTurnitin] = useState<DetectorCheckResult | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [draftsOpen, setDraftsOpen] = useState(false);

  async function migrateLocalDraftsIfNeeded(): Promise<number> {
    if (!draftsApi || hasMigratedLocalWritingDrafts()) {
      return 0;
    }

    const localDrafts = listLocalWritingDrafts();
    if (localDrafts.length === 0) {
      markLocalWritingDraftsMigrated();
      return 0;
    }

    let imported = 0;
    for (const item of localDrafts) {
      const response = await fetch(draftsApi, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          draft: item.draft,
          polished: item.polished,
          mode: item.mode,
        }),
      });
      if (response.ok) {
        imported += 1;
      }
    }

    markLocalWritingDraftsMigrated();
    clearLocalWritingDrafts();
    return imported;
  }

  async function loadDraftsFromServer(): Promise<WritingDraftRecord[]> {
    if (!draftsApi) {
      throw new Error('Workspace is not ready');
    }
    const response = await fetch(draftsApi, { cache: 'no-store' });
    const payload = await readApiJson<{ data?: WritingDraftRecord[]; error?: string }>(response);
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? 'Failed to load writing drafts');
    }
    return payload.data.map(toDraftRecord);
  }

  useEffect(() => {
    if (!draftsApi) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setIsLoadingDrafts(true);
      setError(null);
      try {
        let records = await loadDraftsFromServer();
        if (records.length === 0) {
          const imported = await migrateLocalDraftsIfNeeded();
          if (imported > 0) {
            records = await loadDraftsFromServer();
            if (!cancelled) {
              setNotice(
                `Imported ${imported} local draft${imported === 1 ? '' : 's'} to your account.`,
              );
            }
          }
        } else if (!hasMigratedLocalWritingDrafts()) {
          markLocalWritingDraftsMigrated();
        }

        if (!cancelled) {
          setDrafts(records);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load drafts');
          setDrafts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDrafts(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [draftsApi]);

  function selectedCheckText(): string {
    return (checkTarget === 'polished' ? polished : draft).trim();
  }

  function startNewDraft() {
    setDraftId(null);
    setDraftTitle('Untitled draft');
    setDraft('');
    setPolished('');
    setGptzero(null);
    setTurnitin(null);
    setError(null);
    setNotice('Started a new draft.');
  }

  function loadDraft(record: WritingDraftRecord) {
    setDraftId(record.id);
    setDraftTitle(record.title);
    setDraft(record.draft);
    setPolished(record.polished);
    if (MODES.some((item) => item.value === record.mode)) {
      setMode(record.mode as PolishMode);
    }
    setNotice(`Loaded “${record.title}”.`);
  }

  async function saveCurrentDraft(nextTitle = draftTitle, options?: { polishedText?: string }) {
    if (!draftsApi) {
      setError('Workspace is not ready');
      return null;
    }

    const polishedText = options?.polishedText ?? polished;
    const title = nextTitle.trim() || deriveWritingTitle(draft || polishedText);
    if (!title.trim() && !draft.trim() && !polishedText.trim()) {
      setError('Add some text before saving.');
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const body = {
        title,
        draft,
        polished: polishedText,
        mode,
      };

      const response = await fetch(draftId ? `${draftsApi}/${draftId}` : draftsApi, {
        method: draftId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await readApiJson<{ data?: WritingDraftRecord; error?: string }>(response);
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to save writing draft');
      }

      const record = toDraftRecord(payload.data);
      setDraftId(record.id);
      setDraftTitle(record.title);
      setDrafts((current) => {
        const without = current.filter((item) => item.id !== record.id);
        return [record, ...without].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });
      return record;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save writing draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function openRename() {
    setRenameTitle(draftTitle);
    setRenameOpen(true);
  }

  async function confirmRename() {
    const next = renameTitle.trim() || 'Untitled draft';
    setDraftTitle(next);
    const saved = await saveCurrentDraft(next);
    if (saved) {
      setRenameOpen(false);
      setNotice('Draft renamed.');
    }
  }

  async function removeDraft(id: string) {
    if (!draftsApi) {
      setError('Workspace is not ready');
      return;
    }

    const target = drafts.find((item) => item.id === id);
    if (!target) {
      return;
    }
    const confirmed = window.confirm(`Delete “${target.title}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`${draftsApi}/${id}`, { method: 'DELETE' });
      const payload = await readApiJson<{ ok?: boolean; error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete draft');
      }

      setDrafts((current) => current.filter((item) => item.id !== id));
      if (draftId === id) {
        startNewDraft();
      }
      setNotice('Draft deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete draft');
    }
  }

  async function handlePolish() {
    if (!draft.trim()) {
      setError('Paste or write some text to polish.');
      return;
    }

    setIsPolishing(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/writing/polish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: draft, mode }),
      });
      const payload = await readApiJson<{
        data?: {
          polished?: string;
          mode?: string;
          engine?: 'llm' | 'heuristic';
          reason?: 'no_keys' | 'providers_failed' | null;
          detail?: string | null;
        };
        error?: string;
      }>(response);
      if (!response.ok || !payload.data?.polished) {
        throw new Error(payload.error ?? 'Failed to polish writing');
      }

      setPolished(payload.data.polished);
      if (payload.data.mode && MODES.some((item) => item.value === payload.data?.mode)) {
        setMode(payload.data.mode as PolishMode);
      }

      const saved = await saveCurrentDraft(draftTitle, { polishedText: payload.data.polished });

      if (payload.data.engine === 'heuristic') {
        if (payload.data.reason === 'providers_failed') {
          setNotice(
            `AI providers failed — used light cleanup. ${payload.data.detail ?? 'Check API keys/billing and try again.'}`,
          );
        } else {
          setNotice('Light cleanup only — no LLM API key is loaded on the server.');
        }
      } else if (saved) {
        setNotice(`Polished for ${payload.data.mode ?? mode} and saved to your account.`);
      }
    } catch (polishError) {
      setError(polishError instanceof Error ? polishError.message : 'Failed to polish writing');
    } finally {
      setIsPolishing(false);
    }
  }

  async function handleDetectorCheck() {
    const text = selectedCheckText();
    if (!text) {
      setError(`Add text to the ${checkTarget} box before running a detector check.`);
      return;
    }

    setIsChecking(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/writing/detect`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, source: checkTarget }),
      });
      const payload = await readApiJson<{
        data?: { gptzero?: DetectorCheckResult; turnitin?: DetectorCheckResult };
        error?: string;
      }>(response);
      if (!response.ok || !payload.data?.gptzero || !payload.data.turnitin) {
        throw new Error(payload.error ?? 'Failed to run detector check');
      }

      setGptzero(payload.data.gptzero);
      setTurnitin(payload.data.turnitin);
      setNotice(
        payload.data.gptzero.available
          ? 'Detector report ready (GPTZero API).'
          : 'Use GPTZero free website check below (no paid API key).',
      );
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'Failed to run detector check');
    } finally {
      setIsChecking(false);
    }
  }

  async function openGptZeroFreeCheck() {
    const text = selectedCheckText();
    if (!text) {
      setError(`Add text to the ${checkTarget} box first.`);
      return;
    }

    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      window.open(GPTZERO_FREE_CHECK_URL, '_blank', 'noopener,noreferrer');
      setNotice('Copied your text. Paste it on gptzero.me.');
    } catch {
      window.open(GPTZERO_FREE_CHECK_URL, '_blank', 'noopener,noreferrer');
      setError('Opened GPTZero, but clipboard copy failed — paste manually.');
    }
  }

  async function copySelectedForTurnitin() {
    const text = selectedCheckText();
    if (!text) {
      setError(`Add text to the ${checkTarget} box first.`);
      return;
    }

    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied for your school Turnitin portal.');
    } catch {
      setError('Unable to copy to clipboard.');
    }
  }

  async function copyPolished() {
    if (!polished.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(polished);
      setNotice('Copied polished text.');
    } catch {
      setError('Unable to copy to clipboard.');
    }
  }

  function usePolishedAsDraft() {
    if (!polished.trim()) {
      return;
    }
    setDraft(polished);
    setNotice('Moved polished text into the draft editor.');
  }

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="writing">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  const draftsPanelProps = {
    drafts,
    draftId,
    isLoadingDrafts,
    isSaving,
    onNew: startNewDraft,
    onSave: () => {
      void saveCurrentDraft().then((saved) => {
        if (saved) {
          setNotice('Draft saved to your account.');
        }
      });
    },
    onLoad: loadDraft,
    onDelete: (id: string) => {
      void removeDraft(id);
    },
  };

  return (
    <AppPageShell pageId="writing">
      <AppPageFrame>
        <AppReveal>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
          <AppPanel className="hidden min-h-0 flex-col overflow-hidden lg:flex lg:min-h-[560px] lg:sticky lg:top-4">
            <DraftsPanelBody {...draftsPanelProps} />
          </AppPanel>

          <Sheet onOpenChange={setDraftsOpen} open={draftsOpen}>
            <SheetContent
              className="flex w-[min(100vw,340px)] flex-col border-zinc-200/90 bg-white/95 p-0 sm:max-w-[340px] dark:border-zinc-800 dark:bg-zinc-950/95"
              side="left"
            >
              <SheetHeader className="space-y-0 border-b border-zinc-100 px-4 py-3.5 text-left dark:border-zinc-800/80">
                <SheetTitle className="text-base font-semibold tracking-tight">Drafts</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col">
                <DraftsPanelBody
                  {...draftsPanelProps}
                  onLoad={(item) => {
                    loadDraft(item);
                    setDraftsOpen(false);
                  }}
                  onNew={() => {
                    startNewDraft();
                    setDraftsOpen(false);
                  }}
                  onSave={() => {
                    void saveCurrentDraft().then((saved) => {
                      if (saved) {
                        setNotice('Draft saved to your account.');
                        setDraftsOpen(false);
                      }
                    });
                  }}
                  touchFriendly
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 space-y-4">
            <div className="flex gap-2 lg:hidden">
              <Button
                aria-label="Open drafts"
                className="rounded-xl"
                onClick={() => setDraftsOpen(true)}
                type="button"
                variant="outline"
              >
                <History className="mr-1.5 h-4 w-4" />
                Drafts
              </Button>
              <Button className="flex-1 rounded-xl" onClick={startNewDraft} type="button">
                <Plus className="mr-1.5 h-4 w-4" />
                New
              </Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={isSaving}
                onClick={() => {
                  void saveCurrentDraft().then((saved) => {
                    if (saved) {
                      setNotice('Draft saved to your account.');
                    }
                  });
                }}
                type="button"
                variant="outline"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>

            <AppPanel>
              <AppPanelHeader
                action={
                  <Button
                    className="rounded-xl"
                    onClick={openRename}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Rename
                  </Button>
                }
                description="Polish for clarity and tone — not detector evasion."
                title={draftTitle}
              />
              <AppPanelBody className="space-y-3 pt-0 sm:pt-0">
                <div className="flex items-center gap-2 pb-1 text-zinc-500 dark:text-zinc-400">
                  <PenLine className="h-4 w-4 shrink-0" />
                  <span className="text-xs">Writing tools</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (MODES.some((item) => item.value === value)) {
                        setMode(value as PolishMode);
                      }
                    }}
                    value={mode}
                  >
                    <SelectTrigger
                      aria-label="Polish mode"
                      className="w-full rounded-xl sm:w-[160px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="rounded-xl"
                    disabled={isPolishing || !draft.trim()}
                    onClick={() => void handlePolish()}
                    type="button"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {isPolishing ? 'Polishing…' : 'Polish'}
                  </Button>
                  <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
                  <Select
                    onValueChange={(value) => {
                      if (value === 'draft' || value === 'polished') {
                        setCheckTarget(value);
                      }
                    }}
                    value={checkTarget}
                  >
                    <SelectTrigger
                      aria-label="Text to check"
                      className="w-full rounded-xl sm:w-[140px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Check draft</SelectItem>
                      <SelectItem value="polished">Check polished</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="rounded-xl"
                    disabled={isChecking}
                    onClick={() => void handleDetectorCheck()}
                    type="button"
                    variant="outline"
                  >
                    <ScanSearch className="mr-1.5 h-4 w-4" />
                    {isChecking ? 'Checking…' : 'Report'}
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={() => void openGptZeroFreeCheck()}
                    type="button"
                    variant="secondary"
                  >
                    GPTZero
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={() => void copySelectedForTurnitin()}
                    type="button"
                    variant="ghost"
                  >
                    Turnitin
                  </Button>
                </div>
              </AppPanelBody>
            </AppPanel>

            {error ? <p className={cn(appSurface.alert)}>{error}</p> : null}
            {notice ? <p className={cn(appSurface.notice)}>{notice}</p> : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <AppPanel muted>
                <AppPanelHeader title="Draft" />
                <AppPanelBody className="pt-0 sm:pt-0">
                  <Textarea
                    aria-label="Writing draft"
                    className="min-h-[280px] rounded-xl border-zinc-200/80 bg-white/80 sm:min-h-[320px] dark:border-zinc-700 dark:bg-zinc-950/50"
                    data-testid="writing-draft"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Paste lecture notes, an essay draft, or an email..."
                    value={draft}
                  />
                </AppPanelBody>
              </AppPanel>

              <AppPanel muted>
                <AppPanelHeader
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="rounded-xl"
                        disabled={!polished.trim()}
                        onClick={() => void copyPolished()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button
                        className="rounded-xl"
                        disabled={!polished.trim()}
                        onClick={usePolishedAsDraft}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Use as draft
                      </Button>
                    </div>
                  }
                  title="Polished"
                />
                <AppPanelBody className="pt-0 sm:pt-0">
                  <Textarea
                    aria-label="Polished writing"
                    className="min-h-[280px] rounded-xl border-zinc-200/80 bg-white/80 sm:min-h-[320px] dark:border-zinc-700 dark:bg-zinc-950/50"
                    data-testid="writing-polished"
                    onChange={(event) => setPolished(event.target.value)}
                    placeholder="Polished output appears here..."
                    value={polished}
                  />
                </AppPanelBody>
              </AppPanel>
            </div>

            {gptzero || turnitin ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <AppPanel muted>
                  <AppPanelHeader
                    description="Legitimate transparency check — not evasion."
                    title="GPTZero report"
                  />
                  <AppPanelBody className="space-y-2 text-sm pt-0 sm:pt-0">
                    {gptzero ? (
                      <>
                        <p className="text-zinc-700 dark:text-zinc-300">
                          Status:{' '}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {gptzero.available ? 'In-app API' : 'Use free website'}
                          </span>
                        </p>
                        {gptzero.available ? (
                          <div className={cn(appSurface.inset, 'space-y-1.5 p-3 text-sm')}>
                            <p>Classification: {gptzero.classification ?? '—'}</p>
                            <p>AI probability: {formatPercent(gptzero.aiProbability)}</p>
                            <p>
                              Avg sentence AI prob: {formatPercent(gptzero.averageGeneratedProb)}
                            </p>
                            <p>Confidence: {gptzero.confidence ?? '—'}</p>
                          </div>
                        ) : null}
                        <p className="text-zinc-500 dark:text-zinc-400">{gptzero.message}</p>
                      </>
                    ) : null}
                  </AppPanelBody>
                </AppPanel>
                <AppPanel muted>
                  <AppPanelHeader
                    description="Institutional portal only."
                    title="Turnitin"
                  />
                  <AppPanelBody className="space-y-2 text-sm pt-0 sm:pt-0">
                    {turnitin ? (
                      <>
                        <p className="text-zinc-700 dark:text-zinc-300">
                          Status:{' '}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            School portal only
                          </span>
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">{turnitin.message}</p>
                      </>
                    ) : null}
                  </AppPanelBody>
                </AppPanel>
              </div>
            ) : null}
          </div>
        </div>
        </AppReveal>
      </AppPageFrame>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent className="rounded-2xl border-zinc-200/90 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Rename draft</DialogTitle>
            <DialogDescription>Give this writing draft a clearer title.</DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Draft title"
            className="rounded-xl"
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void confirmRename();
              }
            }}
            value={renameTitle}
          />
          <DialogFooter>
            <Button
              className="rounded-xl"
              onClick={() => setRenameOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={isSaving}
              onClick={() => void confirmRename()}
              type="button"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
