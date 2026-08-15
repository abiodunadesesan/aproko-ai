'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { Mic, Square, Upload } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { TableSkeleton } from '@/components/app/table-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/transcripts`, {
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

      const response = await fetch(`/api/v1/workspaces/${workspaceId}/transcripts`, {
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

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="transcripts">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell headerBadge={`${transcripts.length} files`} pageId="transcripts">
      <AppPageFrame>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            className={cn(
              'rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5',
            )}
          >
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-xs">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:mt-3 sm:text-3xl">
              {isLoading ? '—' : transcripts.length}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:mt-2 sm:text-xs">
              All transcript files
            </p>
          </div>
          <div
            className={cn(
              'rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5',
            )}
          >
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-xs">
              This month
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:mt-3 sm:text-3xl">
              {isLoading ? '—' : thisMonthCount}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:mt-2 sm:text-xs">
              Recently added
            </p>
          </div>
        </div>

        <AppPanel>
          <AppPanelHeader
            description="Upload text/subtitle files or record audio for Whisper transcription."
            title="Capture transcript"
          />
          <AppPanelBody className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={handleUpload}
            >
              <Input
                accept=".txt,.md,.markdown,.vtt,.srt,audio/*,.webm,.mp3,.wav,.m4a"
                aria-label="Choose transcript or audio file"
                className={cn(appSurface.field, 'max-w-xl')}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button
                className="w-full rounded-full sm:w-auto"
                disabled={!file || isUploading || isRecording}
                type="submit"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {isUploading ? 'Processing...' : 'Upload'}
              </Button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {isRecording ? (
                <Button
                  className="w-full rounded-full sm:w-auto"
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
                  className="w-full rounded-full sm:w-auto"
                  disabled={isUploading}
                  onClick={() => void startRecording()}
                  type="button"
                  variant="outline"
                >
                  <Mic className="mr-1.5 h-4 w-4" />
                  Record microphone
                </Button>
              )}
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Text/subtitle files upload immediately. Audio is transcribed with Whisper via{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GROQ_API_KEY</code>{' '}
                (preferred) or{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">OPENAI_API_KEY</code>.
              </p>
            </div>
          </AppPanelBody>
        </AppPanel>

        <AppPanel>
          <AppPanelHeader
            action={
              <Input
                aria-label="Search transcripts"
                className={cn(appSurface.field, 'w-full max-w-xs')}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search transcripts..."
                value={query}
              />
            }
            title="All transcripts"
          />
          <AppPanelBody>
            {error ? (
              <div className={cn(appSurface.alert, 'mb-4')} role="alert">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className={cn(appSurface.notice, 'mb-4')} role="status">
                {notice}
              </div>
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
          </AppPanelBody>
        </AppPanel>
      </AppPageFrame>
    </AppPageShell>
  );
}
