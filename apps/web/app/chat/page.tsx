'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  'anthropic:claude-3-5-sonnet',
  'google:gemini-1.5-pro',
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

function splitModel(model: string): { provider: string | null; name: string | null } {
  const [provider, ...rest] = model.split(':');
  if (!provider || rest.length === 0) {
    return { provider: null, name: null };
  }
  return { provider, name: rest.join(':') || null };
}

function formatModelDisplay(message: ChatMessage): string | null {
  if (message.model) {
    return message.model;
  }
  if (message.modelProvider && message.modelName) {
    return `${message.modelProvider}:${message.modelName}`;
  }
  return null;
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
  const [selectedModel, setSelectedModel] = useState<ChatModel>('openai:gpt-4o-mini');
  const [error, setError] = useState<string | null>(null);

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

  async function renameSession(session: ChatSession) {
    const nextTitle = window.prompt('Rename session', session.title)?.trim() ?? '';
    if (!nextTitle || nextTitle === session.title) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/chat/sessions/${session.id}`,
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
      await loadSessions(session.id);
    } catch (renameError) {
      setError(
        renameError instanceof Error ? renameError.message : 'Failed to rename chat session',
      );
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
    <AppShell
      subtitle="Chat with workspace memory context, citations, and baseline multi-model routing (CHAT-005 + MEM-005)."
      title="AI Chat"
    >
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="space-y-3 p-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Sessions</p>
            <p className="text-xs text-muted-foreground">Context mode: workspace</p>
          </div>

          <Button onClick={() => setActiveSessionId(null)} type="button" variant="outline">
            New session
          </Button>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {isLoadingSessions ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chat sessions yet.</p>
            ) : (
              sessions.map((session) => (
                <article
                  className={`rounded-md border px-3 py-2 text-sm ${
                    activeSessionId === session.id ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                  key={session.id}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => setActiveSessionId(session.id)}
                    type="button"
                  >
                    <p className="font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.lastMessageAt ?? session.updatedAt).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatSessionModel(session) ?? 'model pending'}
                    </p>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        void renameSession(session);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Rename
                    </Button>
                    <Button
                      onClick={() => {
                        void removeSession(session);
                      }}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-[520px] flex-col p-0">
          <CardHeader className="mb-3 border-b pb-3">
            <CardTitle className="text-sm font-semibold">
              {activeSession?.title ?? 'New Chat'}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Workspace-scoped assistant stream | Session model:{' '}
              {activeSession ? (formatSessionModel(activeSession) ?? 'not set') : 'not set'}
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-6 pt-0">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Start a conversation. Your first message creates a session automatically.
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    className={`rounded-md border px-3 py-2 transition-colors ${
                      message.role === 'assistant' ? 'bg-muted/50' : 'bg-background'
                    }`}
                    key={message.id}
                  >
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {message.role}
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Model: {formatModelDisplay(message) ?? 'n/a'} | Transport:{' '}
                      {message.responseTransport ?? 'n/a'} | Status: {message.status ?? 'n/a'}
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
              <Textarea
                className="min-h-24"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question about your workspace..."
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
                    <SelectTrigger className="h-8 w-[230px]" id="chat-model-select">
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
                  <p className="hidden text-xs text-muted-foreground md:block">
                    Streaming contract active (CHAT-005)
                  </p>
                  <Button disabled={isSending || !input.trim()} type="submit">
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
