'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

const WORKSPACE_ID = 'default-workspace';
const LAST_SESSION_STORAGE_KEY = `aproko.chat.last-session.${WORKSPACE_ID}`;
const CHAT_MODELS = [
  'openai:gpt-4o-mini',
  'anthropic:claude-3-5-sonnet',
  'google:gemini-1.5-pro',
] as const;
type ChatModel = (typeof CHAT_MODELS)[number];

type ChatSession = {
  id: string;
  workspaceId: string;
  title: string;
  contextMode: 'workspace';
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
  citations?: ChatCitation[];
  model?: ChatModel;
  memoryContext?: ChatMemoryContext[];
};

type ChatCitation = {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'workspace-source';
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
  const [selectedModel, setSelectedModel] = useState<ChatModel>('openai:gpt-4o-mini');
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

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

    const payload = (await response.json()) as { data?: ChatSession; error?: string };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? 'Failed to create chat session');
    }

    await loadSessions(payload.data.id);
    return payload.data.id;
  }

  async function sendMessage() {
    const trimmed = input.trim();
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
        throw new Error('Failed to stream assistant response');
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
    <AppShell
      subtitle="Chat with workspace memory context, citations, and baseline multi-model routing (CHAT-005 + MEM-005)."
      title="AI Chat"
    >
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className={`${cardClass} space-y-3`}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Sessions</p>
            <p className="text-xs text-muted-foreground">Context mode: workspace</p>
          </div>

          <button
            className={buttonSecondaryClass}
            onClick={() => setActiveSessionId(null)}
            type="button"
          >
            New session
          </button>

          <div className="space-y-2">
            {isLoadingSessions ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chat sessions yet.</p>
            ) : (
              sessions.map((session) => (
                <button
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    activeSessionId === session.id ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  type="button"
                >
                  <p className="font-medium">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className={`${cardClass} flex min-h-[520px] flex-col`}>
          <div className="mb-3 border-b pb-3">
            <p className="text-sm font-semibold">{activeSession?.title ?? 'New Chat'}</p>
            <p className="text-xs text-muted-foreground">Workspace-scoped assistant stream</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start a conversation. Your first message creates a session automatically.
              </p>
            ) : (
              messages.map((message) => (
                <article
                  className={`rounded-md border px-3 py-2 ${
                    message.role === 'assistant' ? 'bg-muted/50' : 'bg-background'
                  }`}
                  key={message.id}
                >
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {message.role}
                  </p>
                  {message.role === 'assistant' && message.model ? (
                    <p className="mb-2 text-xs text-muted-foreground">Model: {message.model}</p>
                  ) : null}
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
                          key={citation.id}
                        >
                          <p className="text-xs font-medium">{citation.title}</p>
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
            className="mt-4 space-y-2 border-t pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <textarea
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about your workspace..."
              value={input}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground" htmlFor="chat-model-select">
                  Model
                </label>
                <select
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                  disabled={isSending}
                  id="chat-model-select"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (isChatModel(value)) {
                      setSelectedModel(value);
                    }
                  }}
                  value={selectedModel}
                >
                  {CHAT_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Streaming contract active (CHAT-005)
                </p>
                <button
                  className={buttonPrimaryClass}
                  disabled={isSending || !input.trim()}
                  type="submit"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
