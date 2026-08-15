'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen, Globe, History, PenLine } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { ChatSessionSidebar } from '@/components/app/chat-session-sidebar';
import { ChatMessageThread } from '@/components/app/chat-message-thread';
import { ChatPromptInput } from '@/components/app/chat-prompt-input';
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
import {
  DEFAULT_CHAT_MODEL,
  getChatModelLabel,
  isChatModel,
  listChatModels,
  type ChatModel,
} from '@/lib/ai/chat-models';
import { cn } from '@/lib/utils';

function lastSessionStorageKey(workspaceId: string) {
  return `aproko.chat.last-session.${workspaceId}`;
}

function focusSourceStorageKey(workspaceId: string) {
  return `aproko.chat.focus-source.${workspaceId}`;
}

const CHAT_MODELS = listChatModels();

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
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>(DEFAULT_CHAT_MODEL);
  const [preferredDefaultModel, setPreferredDefaultModel] = useState<ChatModel>(DEFAULT_CHAT_MODEL);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [focusSourceId, setFocusSourceId] = useState<string | null>(null);
  const [focusSourceName, setFocusSourceName] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
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
      setSelectedModel(preferredDefaultModel);
      return;
    }
    const model = formatSessionModel(activeSession);
    if (model && isChatModel(model)) {
      setSelectedModel(model);
    } else {
      setSelectedModel(preferredDefaultModel);
    }
  }, [activeSession, preferredDefaultModel]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferredModel() {
      try {
        const response = await fetch('/api/v1/me', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          preferences?: { defaultChatModel?: string };
        };
        const next = payload.preferences?.defaultChatModel;
        if (!next || !isChatModel(next) || cancelled) {
          return;
        }
        setPreferredDefaultModel(next);
        setSelectedModel((current) => (current === DEFAULT_CHAT_MODEL ? next : current));
      } catch {
        // Preferences are optional for chat; keep DEFAULT_CHAT_MODEL.
      }
    }

    void loadPreferredModel();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSessions = useCallback(
    async (nextSessionId?: string | null, options?: { preferEmpty?: boolean }) => {
      if (!workspaceId) {
        setIsLoadingSessions(false);
        return;
      }

      setIsLoadingSessions(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}/chat/sessions`);
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
    [workspaceId],
  );

  async function loadMessages(sessionId: string) {
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/workspaces/${workspaceId}/chat/sessions/${sessionId}/messages`,
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
          const response = await fetch(`/api/v1/workspaces/${workspaceId}/chat/voice`, {
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
    const response = await fetch(`/api/v1/workspaces/${workspaceId}/chat/sessions`, {
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
        `/api/v1/workspaces/${workspaceId}/chat/sessions/${renameTarget.id}`,
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
        `/api/v1/workspaces/${workspaceId}/chat/sessions/${session.id}`,
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
    if (!trimmed || isSending || !workspaceId) {
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
        workspaceId: workspaceId,
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
          workspaceId: workspaceId,
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
        `/api/v1/workspaces/${workspaceId}/chat/sessions/${targetSessionId}/messages`,
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
    if (!workspaceId) {
      return;
    }

    const params =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const wantsNewChat = params?.get('new') === '1';
    const searchSessionId = params?.get('session') ?? null;
    const storedSessionId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(lastSessionStorageKey(workspaceId))
        : null;
    const preferredSessionId = wantsNewChat ? null : (searchSessionId ?? storedSessionId);

    const sourceIdFromUrl = params?.get('sourceId')?.trim() || null;
    const sourceNameFromUrl = params?.get('sourceName')?.trim() || null;
    let resolvedSourceId = sourceIdFromUrl;
    let resolvedSourceName = sourceNameFromUrl;

    if (!resolvedSourceId && typeof window !== 'undefined' && !wantsNewChat) {
      try {
        const raw = window.sessionStorage.getItem(focusSourceStorageKey(workspaceId));
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
      window.sessionStorage.removeItem(focusSourceStorageKey(workspaceId));
      resolvedSourceId = null;
      resolvedSourceName = null;
    }

    if (resolvedSourceId) {
      setFocusSourceId(resolvedSourceId);
      setFocusSourceName(resolvedSourceName);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          focusSourceStorageKey(workspaceId),
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
  }, [loadSessions, router, workspaceId]);

  useEffect(() => {
    if (!isHistoryReady || typeof window === 'undefined' || !workspaceId) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete('new');
    params.delete('sourceId');
    params.delete('sourceName');

    if (activeSessionId) {
      params.set('session', activeSessionId);
      window.localStorage.setItem(lastSessionStorageKey(workspaceId), activeSessionId);
    } else {
      params.delete('session');
      window.localStorage.removeItem(lastSessionStorageKey(workspaceId));
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

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="chat">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

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
            setHistoryOpen(false);
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(focusSourceStorageKey(workspaceId));
            }
          }}
          onRenameSession={(session) => {
            openRenameSession(session as ChatSession);
          }}
          onSelectSession={(sessionId) => {
            setActiveSessionId(sessionId);
            setFocusSourceId(null);
            setFocusSourceName(null);
            setHistoryOpen(false);
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(focusSourceStorageKey(workspaceId));
            }
          }}
          sessions={sessions}
        />

        <Sheet onOpenChange={setHistoryOpen} open={historyOpen}>
          <SheetContent className="w-[min(100vw,320px)] p-0 sm:max-w-[320px]" side="left">
            <SheetHeader className="sr-only">
              <SheetTitle>Chat history</SheetTitle>
            </SheetHeader>
            <ChatSessionSidebar
              activeSessionId={activeSessionId}
              className="h-full min-h-0 border-r-0"
              isLoading={isLoadingSessions}
              onDeleteSession={(session) => {
                void removeSession(session as ChatSession);
              }}
              onNewSession={() => {
                setActiveSessionId(null);
                setFocusSourceId(null);
                setFocusSourceName(null);
                setHistoryOpen(false);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem(focusSourceStorageKey(workspaceId));
                }
              }}
              onRenameSession={(session) => {
                openRenameSession(session as ChatSession);
              }}
              onSelectSession={(sessionId) => {
                setActiveSessionId(sessionId);
                setFocusSourceId(null);
                setFocusSourceName(null);
                setHistoryOpen(false);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem(focusSourceStorageKey(workspaceId));
                }
              }}
              sessions={sessions}
            />
          </SheetContent>
        </Sheet>

        <div className="relative flex min-h-[calc(100svh-3rem)] flex-col bg-white dark:bg-[#212121]">
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-start gap-2">
              <Button
                aria-label="Open chat history"
                className="mt-0.5 h-10 w-10 shrink-0 rounded-full lg:hidden"
                onClick={() => setHistoryOpen(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <History className="h-4 w-4" />
              </Button>
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
                    className="h-8 w-auto max-w-[min(100%,14rem)] min-w-0 border-none bg-transparent px-2 text-sm font-medium shadow-none focus:ring-0"
                    id="chat-model-select"
                    data-testid="chat-model-select"
                  >
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {getChatModelLabel(model)}
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
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {showEmptyState ? (
              <div
                className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6"
                data-testid="chat-welcome"
              >
                <h1 className="max-w-xl text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                  What&apos;s on your mind today?
                </h1>
                <p className="mt-3 max-w-md text-center text-sm text-zinc-500">
                  Ask about your library — answers include citations when sources are found.
                </p>

                <div className="mt-10 w-full max-w-2xl">
                  <ChatPromptInput
                    error={error}
                    input={input}
                    isListening={isListening}
                    isSending={isSending}
                    isTranscribingVoice={isTranscribingVoice}
                    onChange={setInput}
                    onSubmit={(text) => void sendMessage(text)}
                    onToggleVoice={() => void toggleVoiceInput()}
                    textareaRef={chatInputRef}
                  />
                </div>

                <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
                  <QuickPrompt href="/writing" icon={PenLine} label="Write or edit" />
                  <QuickPrompt href="/search" icon={Globe} label="Look something up" />
                  <QuickPrompt href="/library" icon={FolderOpen} label="Browse your library" />
                </div>
              </div>
            ) : (
              <ChatMessageThread isSending={isSending} messages={messages} />
            )}
          </div>

          {!showEmptyState ? (
            <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-4 pt-2 dark:from-[#212121] dark:via-[#212121] md:px-6">
              <div className="mx-auto w-full max-w-3xl">
                <ChatPromptInput
                  error={error}
                  input={input}
                  isListening={isListening}
                  isSending={isSending}
                  isTranscribingVoice={isTranscribingVoice}
                  onChange={setInput}
                  onSubmit={(text) => void sendMessage(text)}
                  onToggleVoice={() => void toggleVoiceInput()}
                  textareaRef={chatInputRef}
                />
              </div>
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

