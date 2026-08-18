'use client';

import { Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AudioRecorderSaved = {
  name: string;
};

type AudioRecorderProps = {
  workspaceId: string | null;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  onSaved?: (info: AudioRecorderSaved) => void;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function AudioRecorder({
  workspaceId,
  disabled = false,
  compact = false,
  className,
  onSaved,
  onError,
  onBusyChange,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const busy = isRecording || isUploading;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function reportError(message: string) {
    setError(message);
    setNotice(null);
    onError?.(message);
  }

  async function submitRecording(file: File) {
    if (!workspaceId) {
      reportError('Workspace is still loading. Try again in a moment.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/transcripts`, {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as {
        data?: { transcript?: { name?: string } };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to transcribe recording');
      }

      const name = payload.data?.transcript?.name ?? file.name;
      setNotice(`Saved “${name}”.`);
      onSaved?.({ name });
    } catch (uploadError) {
      reportError(
        uploadError instanceof Error ? uploadError.message : 'Failed to transcribe recording',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function startRecording() {
    setError(null);
    setNotice(null);

    if (!workspaceId) {
      reportError('Workspace is still loading. Try again in a moment.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      reportError('Microphone recording is not supported in this browser.');
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
        void submitRecording(recording);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch {
      reportError('Microphone permission was denied or unavailable.');
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
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {isRecording ? (
          <Button
            className="w-full rounded-full sm:w-auto"
            disabled={disabled || isUploading}
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
            disabled={disabled || isUploading || !workspaceId}
            onClick={() => void startRecording()}
            type="button"
            variant="outline"
          >
            <Mic className="mr-1.5 h-4 w-4" />
            {isUploading ? 'Transcribing…' : 'Record microphone'}
          </Button>
        )}
        {!compact ? (
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Browser mic only. Audio is transcribed and saved to Transcripts.
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-300" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
