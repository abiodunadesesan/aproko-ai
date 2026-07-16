'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUp, FolderOpen, Globe, Mic, PenLine, Square } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { ChatSessionSidebar } from '@/components/app/chat-session-sidebar';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const WORKSPACE_ID = 'default-workspace';
const LAST_SESSION_STORAGE_KEY = `aproko.chat.last-session.${WORKSPACE_ID}`;
const FOCUS_SOURCE_STORAGE_KEY = `aproko.chat.focus-source.${WORKSPACE_ID}`;
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
  const [focusSourceId, setFocusSourceId] = useState<string | null>(null);
  const [focusSourceName, setFocusSourceName] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );
  const showEmptyState = messages.length === 0 && !isSending;

  useEffect(() => {
    if (!activeSession) {
      return;
    }
    const model = formatSessionModel(activeSession);
    if (model && isChatModel(model)) {
      setSelectedModel(model);
    }
  }, [activeSession]);

  const loadSessions = useCallback(
    async (nextSessionId?: string | null, options?: { preferEmpty?: boolean }) => {
      setIsLoadingSessions(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions`);
        const payload = (await response.json()) as SessionsResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load chat sessions');
        }

        setSessions(payload.data);
        if (options?.preferEmpty) {
          setActiveSessionId(null);
          return;
        }

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
    },
    [],
  );

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
          body: JSON.stringify({
            content: trimmed,
            model: selectedModel,
            ...(focusSourceId ? { sourceId: focusSourceId } : {}),
          }),
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
    const params =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const wantsNewChat = params?.get('new') === '1';
    const searchSessionId = params?.get('session') ?? null;
    const storedSessionId =
      typeof window !== 'undefined' ? window.localStorage.getItem(LAST_SESSION_STORAGE_KEY) : null;
    const preferredSessionId = wantsNewChat ? null : (searchSessionId ?? storedSessionId);

    const sourceIdFromUrl = params?.get('sourceId')?.trim() || null;
    const sourceNameFromUrl = params?.get('sourceName')?.trim() || null;
    let resolvedSourceId = sourceIdFromUrl;
    let resolvedSourceName = sourceNameFromUrl;

    if (!resolvedSourceId && typeof window !== 'undefined' && !wantsNewChat) {
      try {
        const raw = window.sessionStorage.getItem(FOCUS_SOURCE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string; name?: string };
          resolvedSourceId = parsed.id?.trim() || null;
          resolvedSourceName = parsed.name?.trim() || null;
        }
      } catch {
        // Ignore corrupt session storage.
      }
    }

    if (wantsNewChat && !sourceIdFromUrl && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(FOCUS_SOURCE_STORAGE_KEY);
      resolvedSourceId = null;
      resolvedSourceName = null;
    }

    if (resolvedSourceId) {
      setFocusSourceId(resolvedSourceId);
      setFocusSourceName(resolvedSourceName);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          FOCUS_SOURCE_STORAGE_KEY,
          JSON.stringify({ id: resolvedSourceId, name: resolvedSourceName }),
        );
      }
      const seeded = resolvedSourceName
        ? `Summarize the key points from "${resolvedSourceName}" and answer my questions about it.`
        : 'Summarize the key points from this document and answer my questions about it.';
      setInput((current) => (current.trim() ? current : seeded));
    } else {
      setFocusSourceId(null);
      setFocusSourceName(null);
    }

    void loadSessions(preferredSessionId, { preferEmpty: Boolean(wantsNewChat) }).finally(() => {
      setIsHistoryReady(true);
      if (wantsNewChat) {
        // Drop new/source query params after capturing them into state/sessionStorage.
        router.replace('/chat');
      }
    });
  }, [loadSessions, router]);

  useEffect(() => {
    if (!isHistoryReady || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete('new');
    params.delete('sourceId');
    params.delete('sourceName');

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  function autoResizeComposer() {
    const el = chatInputRef.current;
    if (!el) {
      return;
    }
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  useEffect(() => {
    autoResizeComposer();
  }, [input]);

  return (
    <AppPageShell immersive pageId="chat">
      <section className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ChatSessionSidebar
          activeSessionId={activeSessionId}
          className="hidden min-h-[calc(100svh-3rem)] lg:flex"
          isLoading={isLoadingSessions}
          onDeleteSession={(session) => {
            void removeSession(session as ChatSession);
          }}
          onNewSession={() => {
            setActiveSessionId(null);
            setFocusSourceId(null);
            setFocusSourceName(null);
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(FOCUS_SOURCE_STORAGE_KEY);
            }
          }}
          onRenameSession={(session) => {
            openRenameSession(session as ChatSession);
          }}
          onSelectSession={(sessionId) => {
            setActiveSessionId(sessionId);
            setFocusSourceId(null);
            setFocusSourceName(null);
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(FOCUS_SOURCE_STORAGE_KEY);
            }
          }}
          sessions={sessions}
        />

        <div className="relative flex min-h-[calc(100svh-3rem)] flex-col bg-white dark:bg-[#212121]">
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <Select
                disabled={isSending}
                onValueChange={(value) => {
                  if (isChatModel(value)) {
                    setSelectedModel(value);
                  }
                }}
                value={selectedModel}
              >
                <SelectTrigger
                  className="h-8 w-auto min-w-[10rem] border-none bg-transparent px-2 text-sm font-medium shadow-none focus:ring-0"
                  id="chat-model-select"
                  data-testid="chat-model-select"
                >
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="truncate px-2 text-[11px] text-zinc-500">
                {activeSession?.title ?? 'New chat'} · grounded in your library
              </p>
              {focusSourceId ? (
                <p
                  className="mt-1 truncate rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  data-testid="chat-focus-source"
                >
                  Asking about: {focusSourceName ?? 'selected document'}
                </p>
              ) : null}
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {showEmptyState ? (
              <div
                className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6"
                data-testid="chat-welcome"
              >
                <h1 className="max-w-xl text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                  What&apos;s on your mind today?
                </h1>
                <p className="mt-3 max-w-md text-center text-sm text-zinc-500">
                  Ask about your documents, notes, and memory — Aproko answers with citations.
                </p>

                <form
                  className="mt-10 w-full max-w-2xl"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(input);
                  }}
                >
                  <Composer
                    error={error}
                    input={input}
                    isListening={isListening}
                    isSending={isSending}
                    isTranscribingVoice={isTranscribingVoice}
                    onChange={setInput}
                    onToggleVoice={() => void toggleVoiceInput()}
                    textareaRef={chatInputRef}
                  />
                </form>

                <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
                  <QuickPrompt href="/writing" icon={PenLine} label="Write or edit" />
                  <QuickPrompt href="/search" icon={Globe} label="Look something up" />
                  <QuickPrompt href="/library" icon={FolderOpen} label="Browse your library" />
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-6">
                {messages.map((message) => (
                  <article
                    className={cn(
                      'group',
                      message.role === 'user' ? 'flex justify-end' : 'flex justify-start',
                    )}
                    data-testid={
                      message.role === 'assistant' ? 'chat-assistant-message' : 'chat-user-message'
                    }
                    key={message.id}
                  >
                    {message.role === 'user' ? (
                      <div className="max-w-[85%] rounded-3xl bg-zinc-100 px-4 py-2.5 text-[15px] leading-relaxed text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ) : (
                      <div className="w-full max-w-none space-y-3 text-[15px] leading-7 text-zinc-800 dark:text-zinc-100">
                        {message.memoryContext?.length ? (
                          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                              Memory
                            </p>
                            {message.memoryContext.map((memory) => (
                              <p
                                className="mt-1 text-xs text-zinc-500"
                                key={`${message.id}-${memory.memoryItemId}`}
                              >
                                {memory.summary}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <p className="whitespace-pre-wrap">
                          {message.content || (isSending ? '…' : '')}
                        </p>
                        {message.citations?.length ? (
                          <div className="space-y-2 border-t border-zinc-200/80 pt-3 dark:border-zinc-800">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                              Citations
                            </p>
                            {message.citations.map((citation) => (
                              <div
                                className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/50"
                                data-testid="chat-citation"
                                key={citation.id}
                              >
                                <p className="text-xs font-medium">
                                  {citation.title}{' '}
                                  <span className="font-normal text-zinc-500">
                                    ({citation.sourceType})
                                  </span>
                                </p>
                                <p className="text-xs text-zinc-500">{citation.snippet}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {!showEmptyState ? (
            <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-4 pt-2 dark:from-[#212121] dark:via-[#212121] md:px-6">
              <form
                className="mx-auto w-full max-w-3xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
              >
                <Composer
                  error={error}
                  input={input}
                  isListening={isListening}
                  isSending={isSending}
                  isTranscribingVoice={isTranscribingVoice}
                  onChange={setInput}
                  onToggleVoice={() => void toggleVoiceInput()}
                  textareaRef={chatInputRef}
                />
              </form>
            </div>
          ) : null}
        </div>
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

function QuickPrompt({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      href={href}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function Composer({
  input,
  error,
  isSending,
  isListening,
  isTranscribingVoice,
  onChange,
  onToggleVoice,
  textareaRef,
}: {
  input: string;
  error: string | null;
  isSending: boolean;
  isListening: boolean;
  isTranscribingVoice: boolean;
  onChange: (value: string) => void;
  onToggleVoice: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const canSend = Boolean(input.trim()) && !isSending;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 rounded-[28px] border border-zinc-200 bg-zinc-50 px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
        <Textarea
          className="max-h-[180px] min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] shadow-none focus-visible:ring-0"
          data-testid="chat-input"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (canSend) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder="Ask anything"
          ref={textareaRef}
          rows={1}
          value={input}
        />
        <div className="flex shrink-0 items-center gap-1 pb-1">
          <Button
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            className="h-9 w-9 rounded-full text-zinc-600 dark:text-zinc-300"
            disabled={isSending || isTranscribingVoice}
            onClick={onToggleVoice}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            aria-label="Send message"
            className={cn(
              'h-9 w-9 rounded-full',
              canSend
                ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500',
            )}
            data-testid="chat-send"
            disabled={!canSend}
            size="icon"
            type="submit"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {error ? <p className="px-2 text-sm text-destructive">{error}</p> : null}
      <p className="px-2 text-center text-[11px] text-zinc-400">
        Aproko can make mistakes. Check citations against your sources.
      </p>
    </div>
  );
}
