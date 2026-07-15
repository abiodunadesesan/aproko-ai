'use client';

import { useEffect, useState } from 'react';
import { Copy, Pencil, PenLine, Plus, ScanSearch, Sparkles, Trash2 } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  createWritingDraftId,
  deleteWritingDraft,
  deriveWritingTitle,
  listWritingDrafts,
  upsertWritingDraft,
  type WritingDraftRecord,
} from '@/lib/writing/draft-history';

const WORKSPACE_ID = 'default-workspace';

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

export default function WritingPage() {
  const [draftId, setDraftId] = useState(() => createWritingDraftId());
  const [draftTitle, setDraftTitle] = useState('Untitled draft');
  const [drafts, setDrafts] = useState<WritingDraftRecord[]>([]);
  const [draft, setDraft] = useState('');
  const [polished, setPolished] = useState('');
  const [mode, setMode] = useState<PolishMode>('clarity');
  const [checkTarget, setCheckTarget] = useState<'draft' | 'polished'>('draft');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gptzero, setGptzero] = useState<DetectorCheckResult | null>(null);
  const [turnitin, setTurnitin] = useState<DetectorCheckResult | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    setDrafts(listWritingDrafts());
  }, []);

  function refreshDrafts() {
    setDrafts(listWritingDrafts());
  }

  function selectedCheckText(): string {
    return (checkTarget === 'polished' ? polished : draft).trim();
  }

  function startNewDraft() {
    setDraftId(createWritingDraftId());
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

  function saveCurrentDraft(nextTitle = draftTitle) {
    const record = upsertWritingDraft({
      id: draftId,
      title: nextTitle.trim() || deriveWritingTitle(draft || polished),
      draft,
      polished,
      mode,
    });
    setDraftTitle(record.title);
    refreshDrafts();
    return record;
  }

  function openRename() {
    setRenameTitle(draftTitle);
    setRenameOpen(true);
  }

  function confirmRename() {
    const next = renameTitle.trim() || 'Untitled draft';
    setDraftTitle(next);
    saveCurrentDraft(next);
    setRenameOpen(false);
    setNotice('Draft renamed.');
  }

  function removeDraft(id: string) {
    const target = drafts.find((item) => item.id === id);
    if (!target) {
      return;
    }
    const confirmed = window.confirm(`Delete “${target.title}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    deleteWritingDraft(id);
    refreshDrafts();
    if (draftId === id) {
      startNewDraft();
    }
    setNotice('Draft deleted.');
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
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/writing/polish`, {
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
      const saved = upsertWritingDraft({
        id: draftId,
        title: draftTitle.trim() || deriveWritingTitle(draft),
        draft,
        polished: payload.data.polished,
        mode: payload.data.mode ?? mode,
      });
      setDraftTitle(saved.title);
      refreshDrafts();

      if (payload.data.engine === 'heuristic') {
        if (payload.data.reason === 'providers_failed') {
          setNotice(
            `AI providers failed — used light cleanup. ${payload.data.detail ?? 'Check API keys/billing and try again.'}`,
          );
        } else {
          setNotice('Light cleanup only — no LLM API key is loaded on the server.');
        }
      } else {
        setNotice(`Polished for ${payload.data.mode ?? mode} and saved to history.`);
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
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/writing/detect`, {
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

  return (
    <AppPageShell pageId="writing">
      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <div className="space-y-3 border-b border-zinc-200/80 p-4 dark:border-zinc-800">
            <Button className="w-full rounded-xl" onClick={startNewDraft} type="button">
              <Plus className="mr-1.5 h-4 w-4" />
              New draft
            </Button>
            <Button
              className="w-full rounded-xl"
              onClick={() => saveCurrentDraft()}
              type="button"
              variant="outline"
            >
              Save current
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {drafts.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Saved drafts appear here. Polish or Save to keep history.
              </p>
            ) : (
              <ul className="space-y-1">
                {drafts.map((item) => {
                  const isActive = item.id === draftId;
                  return (
                    <li key={item.id}>
                      <div
                        className={`group flex items-start gap-1 rounded-xl border px-2 py-2 ${
                          isActive
                            ? 'border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80'
                            : 'border-transparent hover:bg-white/80 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => loadDraft(item)}
                          type="button"
                        >
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleString()}
                          </p>
                        </button>
                        <Button
                          aria-label={`Delete ${item.title}`}
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeDraft(item.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PenLine className="h-4 w-4" />
                    {draftTitle}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Polish for clarity and tone — not detector evasion.
                  </p>
                </div>
                <Button onClick={openRename} size="sm" type="button" variant="outline">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Rename
                </Button>
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
                  <SelectTrigger aria-label="Polish mode" className="w-[160px] rounded-xl">
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
                  <SelectTrigger aria-label="Text to check" className="w-[140px] rounded-xl">
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
            </CardHeader>
          </Card>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  aria-label="Writing draft"
                  className="min-h-[320px] rounded-xl"
                  data-testid="writing-draft"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Paste lecture notes, an essay draft, or an email..."
                  value={draft}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Polished</CardTitle>
                <div className="flex gap-2">
                  <Button
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
                    disabled={!polished.trim()}
                    onClick={usePolishedAsDraft}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Use as draft
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  aria-label="Polished writing"
                  className="min-h-[320px] rounded-xl"
                  data-testid="writing-polished"
                  onChange={(event) => setPolished(event.target.value)}
                  placeholder="Polished output appears here..."
                  value={polished}
                />
              </CardContent>
            </Card>
          </div>

          {gptzero || turnitin ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">GPTZero report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {gptzero ? (
                    <>
                      <p>
                        Status:{' '}
                        <span className="font-medium">
                          {gptzero.available ? 'In-app API' : 'Use free website'}
                        </span>
                      </p>
                      {gptzero.available ? (
                        <>
                          <p>Classification: {gptzero.classification ?? '—'}</p>
                          <p>AI probability: {formatPercent(gptzero.aiProbability)}</p>
                          <p>Avg sentence AI prob: {formatPercent(gptzero.averageGeneratedProb)}</p>
                          <p>Confidence: {gptzero.confidence ?? '—'}</p>
                        </>
                      ) : null}
                      <p className="text-muted-foreground">{gptzero.message}</p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Turnitin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {turnitin ? (
                    <>
                      <p>
                        Status: <span className="font-medium">School portal only</span>
                      </p>
                      <p className="text-muted-foreground">{turnitin.message}</p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </section>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename draft</DialogTitle>
            <DialogDescription>Give this writing draft a clearer title.</DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Draft title"
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmRename();
              }
            }}
            value={renameTitle}
          />
          <DialogFooter>
            <Button onClick={() => setRenameOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={confirmRename} type="button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
