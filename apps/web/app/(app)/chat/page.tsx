'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { ChatSessionSidebar } from '@/components/app/chat-session-sidebar';
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

const WORKSPACE_ID = 'default-workspace';
const LAST_SESSION_STORAGE_KEY = `aproko.chat.last-session.${WORKSPACE_ID}`;
const CHAT_MODELS = [
  'openai:gpt-4o-mini',
  'anthropic:claude-sonnet-5',
  'google:gemini-3.5-flash',
  'groq:llama-3.1-8b-instant',
] as const;
type ChatModel = (typeof CHAT_MODELS)[number];

type ChatSession = {
  id: string;
  workspaceId: string;
  title: string;
  contextMode: 'workspace';
  modelProvider: string | null;
  modelName: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  workspaceId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  responseTransport?: string;
  modelProvider?: string | null;
  modelName?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
  citations?: ChatCitation[];
  model?: string;
  memoryContext?: ChatMemoryContext[];
};

type ChatCitation = {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'workspace-source' | 'note' | 'memory' | 'transcript';
};

type ChatMemoryContext = {
  memoryItemId: string;
  memoryType: 'fact' | 'preference' | 'project' | 'decision' | 'task' | 'timeline_event';
  summary: string;
  rankScore: number;
};

type SessionsResponse = { data: ChatSession[]; error?: string };
type MessagesResponse = { data: ChatMessage[]; error?: string };
type SseEventType = 'start' | 'delta' | 'done' | 'error';

type ParsedSseEvent = {
  event: SseEventType;
  payload: {
    content?: string;
    message?: string;
    citations?: ChatCitation[];
    model?: string;
    memoryContext?: ChatMemoryContext[];
  };
};

function isChatModel(value: string): value is ChatModel {
  return CHAT_MODELS.includes(value as ChatModel);
}

function deriveSessionTitle(content: string): string {
  return content.trim().slice(0, 50) || 'New chat';
}

function splitModel(model: string): { provider: string | null; name: string | null } {
  const [provider, ...rest] = model.split(':');
  if (!provider || rest.length === 0) {
    return { provider: null, name: null };
  }
  return { provider, name: rest.join(':') || null };
}

function formatSessionModel(session: ChatSession): string | null {
  if (session.modelProvider && session.modelName) {
    return `${session.modelProvider}:${session.modelName}`;
  }
  return null;
}

function parseSseEventsFromBuffer(buffer: string): { events: ParsedSseEvent[]; rest: string } {
  const frames = buffer.split('\n\n');
  const rest = frames.pop() ?? '';
  const events: ParsedSseEvent[] = [];

  for (const frame of frames) {
    const lines = frame.split('\n');
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLine = lines.find((line) => line.startsWith('data:'));

    if (!eventLine || !dataLine) {
      continue;
    }

    const event = eventLine.replace('event:', '').trim() as SseEventType;
    if (!['start', 'delta', 'done', 'error'].includes(event)) {
      continue;
    }

    const json = dataLine.replace('data:', '').trim();
    try {
      const payload = JSON.parse(json) as {
        content?: string;
        message?: string;
        citations?: ChatCitation[];
        model?: string;
        memoryContext?: ChatMemoryContext[];
      };
      events.push({ event, payload });
    } catch {
      continue;
    }
  }

  return { events, rest };
}

export default function ChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>('groq:llama-3.1-8b-instant');
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  useEffect(() => {
    if (!activeSession) {
      return;
    }
    const model = formatSessionModel(activeSession);
    if (model && isChatModel(model)) {
      setSelectedModel(model);
    }
  }, [activeSession]);

  const loadSessions = useCallback(async (nextSessionId?: string | null) => {
    setIsLoadingSessions(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions`);
      const payload = (await response.json()) as SessionsResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load chat sessions');
      }

      setSessions(payload.data);
      const fallbackId = payload.data[0]?.id ?? null;
      const requestedId = nextSessionId?.trim() ?? '';
      const requestedIsAvailable = requestedId
        ? payload.data.some((session) => session.id === requestedId)
        : false;
      setActiveSessionId(requestedIsAvailable ? requestedId : fallbackId);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load chat sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  async function loadMessages(sessionId: string) {
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions/${sessionId}/messages`,
      );
      const payload = (await response.json()) as MessagesResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load chat messages');
      }

      setMessages(payload.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load chat messages');
      setMessages([]);
    }
  }

  function appendVoiceText(text: string) {
    const next = text.trim();
    if (!next) {
      return;
    }
    setInput((current) => {
      const base = current.trim();
      return base ? `${base} ${next}` : next;
    });
  }

  function stopBrowserSpeech() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function startBrowserSpeech(): boolean {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (
            window as Window & {
              SpeechRecognition?: new () => {
                continuous: boolean;
                interimResults: boolean;
                lang: string;
                onresult:
                  | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
                  | null;
                onerror: (() => void) | null;
                onend: (() => void) | null;
                start: () => void;
                stop: () => void;
              };
              webkitSpeechRecognition?: new () => {
                continuous: boolean;
                interimResults: boolean;
                lang: string;
                onresult:
                  | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
                  | null;
                onerror: (() => void) | null;
                onend: (() => void) | null;
                start: () => void;
                stop: () => void;
              };
            }
          ).SpeechRecognition ||
          (
            window as Window & {
              webkitSpeechRecognition?: new () => {
                continuous: boolean;
                interimResults: boolean;
                lang: string;
                onresult:
                  | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
                  | null;
                onerror: (() => void) | null;
                onend: (() => void) | null;
                start: () => void;
                stop: () => void;
              };
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      return false;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript?.trim();
      if (transcript) {
        setInput(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    return true;
  }

  async function startWhisperVoiceCapture() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not available in this browser.');
      return;
    }

    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    voiceChunksRef.current = [];

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
        voiceChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      voiceChunksRef.current = [];

      const file = new File([blob], `chat-voice-${Date.now()}.webm`, {
        type: blob.type || 'audio/webm',
      });
      void (async () => {
        setIsTranscribingVoice(true);
        try {
          const formData = new FormData();
          formData.append('audio', file);
          const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/chat/voice`, {
            method: 'POST',
            body: formData,
          });
          const payload = (await response.json()) as { data?: { text?: string }; error?: string };
          if (!response.ok || !payload.data?.text) {
            throw new Error(payload.error ?? 'Failed to transcribe voice input');
          }
          appendVoiceText(payload.data.text);
        } catch (voiceError) {
          setError(
            voiceError instanceof Error ? voiceError.message : 'Failed to transcribe voice input',
          );
        } finally {
          setIsTranscribingVoice(false);
          setIsListening(false);
        }
      })();
    };

    recorder.start(500);
    setIsListening(true);
  }

  async function toggleVoiceInput() {
    if (isSending || isTranscribingVoice) {
      return;
    }

    if (isListening) {
      stopBrowserSpeech();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (startBrowserSpeech()) {
      return;
    }

    try {
      await startWhisperVoiceCapture();
    } catch {
      setError('Microphone permission was denied or unavailable.');
      setIsListening(false);
    }
  }

  useEffect(() => {
    return () => {
      stopBrowserSpeech();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function createSessionFromPrompt(prompt: string): Promise<string | null> {
    const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: deriveSessionTitle(prompt),
        contextMode: 'workspace',
      }),
    });

    const raw = await response.text();
    let payload: { data?: ChatSession; error?: string } | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as { data?: ChatSession; error?: string }) : null;
    } catch {
      throw new Error(
        response.redirected || raw.trimStart().startsWith('<')
          ? 'You need to sign in again before starting a chat.'
          : `Failed to create chat session (${response.status})`,
      );
    }
    if (!response.ok || !payload?.data) {
      throw new Error(payload?.error ?? 'Failed to create chat session');
    }

    await loadSessions(payload.data.id);
    return payload.data.id;
  }

  function openRenameSession(session: ChatSession) {
    setRenameTarget(session);
    setRenameTitle(session.title);
  }

  async function confirmRenameSession() {
    if (!renameTarget) {
      return;
    }
    const nextTitle = renameTitle.trim();
    if (!nextTitle || nextTitle === renameTarget.title) {
      setRenameTarget(null);
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions/${renameTarget.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: nextTitle }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to rename chat session');
      }
      await loadSessions(renameTarget.id);
      setRenameTarget(null);
    } catch (renameError) {
      setError(
        renameError instanceof Error ? renameError.message : 'Failed to rename chat session',
      );
    } finally {
      setIsRenaming(false);
    }
  }

  async function removeSession(session: ChatSession) {
    const confirmed = window.confirm(`Delete "${session.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions/${session.id}`,
        {
          method: 'DELETE',
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete chat session');
      }

      const fallback = activeSessionId === session.id ? null : activeSessionId;
      await loadSessions(fallback);
      if (activeSessionId === session.id) {
        setMessages([]);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete chat session',
      );
    }
  }

  async function sendMessage(contentOverride?: string) {
    const trimmed = (contentOverride ?? chatInputRef.current?.value ?? input).trim();
    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setInput('');

    try {
      const targetSessionId = activeSessionId ?? (await createSessionFromPrompt(trimmed));
      if (!targetSessionId) {
        throw new Error('Unable to initialize chat session');
      }

      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        workspaceId: WORKSPACE_ID,
        sessionId: targetSessionId,
        role: 'user',
        content: trimmed,
        responseTransport: 'sse',
        model: selectedModel,
        modelProvider: splitModel(selectedModel).provider,
        modelName: splitModel(selectedModel).name,
        status: 'completed',
        metadata: { source: 'user' },
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = `temp-assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantMessageId,
          workspaceId: WORKSPACE_ID,
          sessionId: targetSessionId,
          role: 'assistant',
          model: selectedModel,
          responseTransport: 'sse',
          modelProvider: splitModel(selectedModel).provider,
          modelName: splitModel(selectedModel).name,
          status: 'streaming',
          metadata: {},
          content: '',
          createdAt: new Date().toISOString(),
        },
      ]);

      const streamResponse = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions/${targetSessionId}/messages`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ content: trimmed, model: selectedModel }),
        },
      );

      if (!streamResponse.ok || !streamResponse.body) {
        const payload = (await streamResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Failed to stream assistant response');
      }

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';
      let sawDone = false;

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;

        buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !done });
        const parsed = parseSseEventsFromBuffer(buffer);
        buffer = parsed.rest;

        for (const event of parsed.events) {
          if (event.event === 'delta' && event.payload.content) {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? { ...item, content: item.content + event.payload.content }
                  : item,
              ),
            );
          }

          if (event.event === 'error') {
            throw new Error(event.payload.message ?? 'Streaming failed');
          }

          if (event.event === 'start' && event.payload.model && isChatModel(event.payload.model)) {
            const streamModel: ChatModel = event.payload.model;
            const streamMemoryContext = event.payload.memoryContext ?? [];
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      model: streamModel,
                      ...(streamMemoryContext.length ? { memoryContext: streamMemoryContext } : {}),
                    }
                  : item,
              ),
            );
          }

          if (event.event === 'done') {
            const modelFromEvent = event.payload.model;
            const resolvedModel =
              modelFromEvent && isChatModel(modelFromEvent) ? modelFromEvent : null;
            const hasCitations = Boolean(event.payload.citations?.length);
            const hasMemoryContext = Boolean(event.payload.memoryContext?.length);
            if (resolvedModel || hasCitations || hasMemoryContext) {
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId
                    ? {
                        ...item,
                        ...(hasCitations ? { citations: event.payload.citations ?? [] } : {}),
                        ...(resolvedModel ? { model: resolvedModel } : {}),
                        status: 'completed',
                        ...(hasMemoryContext
                          ? { memoryContext: event.payload.memoryContext ?? [] }
                          : {}),
                      }
                    : item,
                ),
              );
            }
            sawDone = true;
          }
        }
      }

      if (!sawDone) {
        throw new Error('Streaming ended before completion');
      }

      await loadSessions(targetSessionId);
      await loadMessages(targetSessionId);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    const searchSessionId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('session')
        : null;
    const storedSessionId =
      typeof window !== 'undefined' ? window.localStorage.getItem(LAST_SESSION_STORAGE_KEY) : null;
    const preferredSessionId = searchSessionId ?? storedSessionId;

    void loadSessions(preferredSessionId).finally(() => {
      setIsHistoryReady(true);
    });
  }, [loadSessions]);

  useEffect(() => {
    if (!isHistoryReady || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (activeSessionId) {
      params.set('session', activeSessionId);
      window.localStorage.setItem(LAST_SESSION_STORAGE_KEY, activeSessionId);
    } else {
      params.delete('session');
      window.localStorage.removeItem(LAST_SESSION_STORAGE_KEY);
    }

    const query = params.toString();
    const nextUrl = query ? `/chat?${query}` : '/chat';
    router.replace(nextUrl);
  }, [activeSessionId, isHistoryReady, router]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeSessionId);
  }, [activeSessionId]);

  return (
    <AppPageShell pageId="chat">
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ChatSessionSidebar
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onDeleteSession={(session) => {
            void removeSession(session as ChatSession);
          }}
          onNewSession={() => setActiveSessionId(null)}
          onRenameSession={(session) => {
            openRenameSession(session as ChatSession);
          }}
          onSelectSession={setActiveSessionId}
          sessions={sessions}
        />

        <Card className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border-zinc-200/80 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader className="border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {activeSession?.title ?? 'New chat'}
            </CardTitle>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Grounded in your library · Model:{' '}
              {activeSession ? (formatSessionModel(activeSession) ?? selectedModel) : selectedModel}
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-4 sm:p-6">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    Hi — ask anything about your workspace
                  </p>
                  <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
                    Your first message creates a chat. Use rename and delete in the sidebar to
                    manage conversations.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    className={`rounded-xl border px-3 py-2.5 transition-colors ${
                      message.role === 'assistant'
                        ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                    data-testid={
                      message.role === 'assistant' ? 'chat-assistant-message' : 'chat-user-message'
                    }
                    key={message.id}
                  >
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {message.role}
                    </p>
                    {message.role === 'assistant' && message.memoryContext?.length ? (
                      <div className="mb-2 rounded-md border bg-background px-2 py-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Memory Context
                        </p>
                        {message.memoryContext.map((memory) => (
                          <p
                            className="mt-1 text-xs text-muted-foreground"
                            key={`${message.id}-${memory.memoryItemId}`}
                          >
                            {memory.summary} ({memory.memoryType}, {memory.rankScore.toFixed(2)})
                          </p>
                        ))}
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content || (isSending ? '...' : '')}
                    </p>
                    {message.role === 'assistant' && message.citations?.length ? (
                      <div className="mt-3 space-y-2 border-t pt-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Citations
                        </p>
                        {message.citations.map((citation) => (
                          <div
                            className="rounded-md border bg-background px-2 py-1.5"
                            data-testid="chat-citation"
                            key={citation.id}
                          >
                            <p className="text-xs font-medium">
                              {citation.title}{' '}
                              <span className="font-normal text-muted-foreground">
                                ({citation.sourceType})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">{citation.snippet}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <form
              className="mt-4 space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800"
              onSubmit={(event) => {
                event.preventDefault();
                const textarea = event.currentTarget.querySelector(
                  '[data-testid="chat-input"]',
                ) as HTMLTextAreaElement | null;
                void sendMessage(textarea?.value);
              }}
            >
              <Textarea
                className="min-h-24 rounded-xl"
                data-testid="chat-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question about your workspace..."
                ref={chatInputRef}
                value={input}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground" htmlFor="chat-model-select">
                    Model
                  </label>
                  <Select
                    disabled={isSending}
                    onValueChange={(value) => {
                      if (isChatModel(value)) {
                        setSelectedModel(value);
                      }
                    }}
                    value={selectedModel}
                  >
                    <SelectTrigger className="h-8 w-[230px] rounded-xl" id="chat-model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHAT_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Button
                    className="rounded-xl"
                    disabled={isSending || isTranscribingVoice}
                    onClick={() => void toggleVoiceInput()}
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                  >
                    {isListening ? (
                      <>
                        <Square className="mr-1.5 h-3.5 w-3.5" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="mr-1.5 h-3.5 w-3.5" />
                        {isTranscribingVoice ? 'Transcribing...' : 'Voice'}
                      </>
                    )}
                  </Button>
                  <Button
                    className="rounded-xl"
                    data-testid="chat-send"
                    disabled={isSending || !input.trim()}
                    type="submit"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
          }
        }}
        open={Boolean(renameTarget)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Update the conversation title in your sidebar.</DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Chat title"
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void confirmRenameSession();
              }
            }}
            value={renameTitle}
          />
          <DialogFooter>
            <Button onClick={() => setRenameTarget(null)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isRenaming || !renameTitle.trim()}
              onClick={() => void confirmRenameSession()}
              type="button"
            >
              {isRenaming ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
