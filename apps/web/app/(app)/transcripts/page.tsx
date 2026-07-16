'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { EmptyState } from '@/components/app/empty-state';
import { TableSkeleton } from '@/components/app/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const WORKSPACE_ID = 'default-workspace';

type TranscriptSource = {
  id: string;
  name: string;
  project: string;
  folder: string;
  size: number;
  updatedAt: string | null;
  sourceType?: string | null;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isThisMonth(isoDate: string | null): boolean {
  if (!isoDate) {
    return false;
  }
  const date = new Date(isoDate);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<TranscriptSource[]>([]);
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  async function loadTranscripts() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/transcripts`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as { data?: TranscriptSource[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load transcripts');
      }
      setTranscripts(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load transcripts');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTranscripts();
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return transcripts;
    }
    return transcripts.filter((item) => item.name.toLowerCase().includes(trimmed));
  }, [query, transcripts]);

  const thisMonthCount = useMemo(
    () => transcripts.filter((item) => isThisMonth(item.updatedAt)).length,
    [transcripts],
  );

  async function submitTranscriptFile(nextFile: File) {
    setIsUploading(true);
    setError(null);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', nextFile);

      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/transcripts`, {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as {
        data?: { transcript?: TranscriptSource; audio?: TranscriptSource | null };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create transcript');
      }

      setFile(null);
      setNotice(
        payload.data?.audio
          ? `Transcribed and saved “${payload.data.transcript?.name ?? 'transcript'}”.`
          : `Saved “${payload.data?.transcript?.name ?? nextFile.name}”.`,
      );
      await loadTranscripts();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to create transcript');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      return;
    }
    await submitTranscriptFile(file);
  }

  async function startRecording() {
    setError(null);
    setNotice(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const recording = new File([blob], `mic-recording-${Date.now()}.${extension}`, {
          type: blob.type || 'audio/webm',
        });
        void submitTranscriptFile(recording);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch {
      setError('Microphone permission was denied or unavailable.');
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }

  return (
    <AppPageShell headerBadge={`${transcripts.length} files`} pageId="transcripts">
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoading ? '—' : transcripts.length}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">All transcript files</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                This month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoading ? '—' : thisMonthCount}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Recently added</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-base">Capture transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={handleUpload}
            >
              <Input
                accept=".txt,.md,.markdown,.vtt,.srt,audio/*,.webm,.mp3,.wav,.m4a"
                aria-label="Choose transcript or audio file"
                className="max-w-xl"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button
                className="rounded-full"
                disabled={!file || isUploading || isRecording}
                type="submit"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {isUploading ? 'Processing...' : 'Upload'}
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {isRecording ? (
                <Button
                  className="rounded-full"
                  disabled={isUploading}
                  onClick={stopRecording}
                  type="button"
                  variant="destructive"
                >
                  <Square className="mr-1.5 h-4 w-4" />
                  Stop ({formatDuration(recordingSeconds)})
                </Button>
              ) : (
                <Button
                  className="rounded-full"
                  disabled={isUploading}
                  onClick={() => void startRecording()}
                  type="button"
                  variant="outline"
                >
                  <Mic className="mr-1.5 h-4 w-4" />
                  Record microphone
                </Button>
              )}
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Text/subtitle files upload immediately. Audio is transcribed with Whisper via{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GROQ_API_KEY</code>{' '}
                (preferred) or{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">OPENAI_API_KEY</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All transcripts</CardTitle>
            <Input
              aria-label="Search transcripts"
              className="max-w-xs"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transcripts..."
              value={query}
            />
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
            {notice ? (
              <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>
            ) : null}

            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : filtered.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild className="rounded-full" variant="outline">
                    <Link href="/chat">Open AI Chat</Link>
                  </Button>
                }
                description="Upload a transcript or record your microphone. Audio becomes searchable text in your workspace."
                icon={Mic}
                title={query.trim() ? 'No matching transcripts' : 'No transcripts yet'}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          href={`/library/${item.id}`}
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize text-zinc-600 dark:text-zinc-400">
                        {item.sourceType ?? 'transcript'}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </AppPageShell>
  );
}
