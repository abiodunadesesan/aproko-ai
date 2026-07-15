'use client';

import { useState } from 'react';
import { Copy, PenLine, ScanSearch, Sparkles } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

export default function WritingPage() {
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

  function selectedCheckText(): string {
    return (checkTarget === 'polished' ? polished : draft).trim();
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
      const payload = (await response.json()) as {
        data?: { polished?: string; mode?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.polished) {
        throw new Error(payload.error ?? 'Failed to polish writing');
      }

      setPolished(payload.data.polished);
      setNotice(`Polished for ${payload.data.mode ?? mode}.`);
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
      const payload = (await response.json()) as {
        data?: { gptzero?: DetectorCheckResult; turnitin?: DetectorCheckResult };
        error?: string;
      };
      if (!response.ok || !payload.data?.gptzero || !payload.data.turnitin) {
        throw new Error(payload.error ?? 'Failed to run detector check');
      }

      setGptzero(payload.data.gptzero);
      setTurnitin(payload.data.turnitin);
      setNotice(
        payload.data.gptzero.available
          ? 'Detector report ready (GPTZero API). Turnitin still needs your school portal.'
          : 'No paid GPTZero API key configured. Use “Open GPTZero free check” below (copy + paste on their site).',
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
      setNotice('Copied your text. Paste it on gptzero.me (free web checker — no API key needed).');
    } catch {
      window.open(GPTZERO_FREE_CHECK_URL, '_blank', 'noopener,noreferrer');
      setError('Opened GPTZero, but clipboard copy failed — paste your text manually.');
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
      setNotice(
        'Copied. Paste into your school Turnitin assignment/inbox to check similarity / AI report.',
      );
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
      <section className="space-y-4">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-4 w-4" />
              Writing polish + detector check
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Polish for clarity and tone, then check with GPTZero’s free website or your school
              Turnitin portal. This is not a tool for bypassing detectors.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Select
              onValueChange={(value) => {
                if (MODES.some((item) => item.value === value)) {
                  setMode(value as PolishMode);
                }
              }}
              value={mode}
            >
              <SelectTrigger aria-label="Polish mode" className="w-[200px]">
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
              className="rounded-full"
              disabled={isPolishing || !draft.trim()}
              onClick={() => void handlePolish()}
              type="button"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {isPolishing ? 'Polishing...' : 'Polish draft'}
            </Button>
            <Select
              onValueChange={(value) => {
                if (value === 'draft' || value === 'polished') {
                  setCheckTarget(value);
                }
              }}
              value={checkTarget}
            >
              <SelectTrigger aria-label="Text to check" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Check draft</SelectItem>
                <SelectItem value="polished">Check polished</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="rounded-full"
              disabled={isChecking}
              onClick={() => void handleDetectorCheck()}
              type="button"
              variant="outline"
            >
              <ScanSearch className="mr-1.5 h-4 w-4" />
              {isChecking ? 'Checking...' : 'In-app report'}
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void openGptZeroFreeCheck()}
              type="button"
              variant="secondary"
            >
              Open GPTZero free check
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void copySelectedForTurnitin()}
              type="button"
              variant="ghost"
            >
              Copy for Turnitin
            </Button>
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-base">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                aria-label="Writing draft"
                className="min-h-[320px]"
                data-testid="writing-draft"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Paste lecture notes, an essay draft, or an email..."
                value={draft}
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
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
                className="min-h-[320px]"
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
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
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
                    {!gptzero.available ? (
                      <Button
                        className="mt-2"
                        onClick={() => void openGptZeroFreeCheck()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Copy + open gptzero.me
                      </Button>
                    ) : null}
                    {gptzero.flaggedSentences.length > 0 ? (
                      <div className="space-y-1 pt-2">
                        <p className="font-medium">Highlighted sentences</p>
                        {gptzero.flaggedSentences.map((sentence) => (
                          <p className="rounded-md border px-2 py-1 text-xs" key={sentence.text}>
                            {sentence.text} ({formatPercent(sentence.generatedProb)})
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
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
                    <Button
                      className="mt-2"
                      onClick={() => void copySelectedForTurnitin()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Copy text for Turnitin
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>
    </AppPageShell>
  );
}
