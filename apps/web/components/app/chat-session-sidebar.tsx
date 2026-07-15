'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export type ChatSessionListItem = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  updatedAt: string;
  modelProvider: string | null;
  modelName: string | null;
};

type ChatSessionSidebarProps = {
  sessions: ChatSessionListItem[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (session: ChatSessionListItem) => void;
  onDeleteSession: (session: ChatSessionListItem) => void;
};

function formatSessionModel(session: ChatSessionListItem): string | null {
  if (session.modelProvider && session.modelName) {
    return `${session.modelProvider}:${session.modelName}`;
  }
  return null;
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
}: ChatSessionSidebarProps) {
  const [query, setQuery] = useState('');

  const filteredSessions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return sessions;
    }
    return sessions.filter((session) => session.title.toLowerCase().includes(trimmed));
  }, [query, sessions]);

  return (
    <aside className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <div className="space-y-3 border-b border-zinc-200/80 p-4 dark:border-zinc-800">
        <Button className="w-full rounded-xl" onClick={onNewSession} type="button">
          <Plus className="mr-1.5 h-4 w-4" />
          New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            aria-label="Search conversations"
            className="h-9 rounded-xl border-zinc-200 bg-white pl-9 dark:border-zinc-700 dark:bg-zinc-950"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats..."
            value={query}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            compact
            className="mx-1 border-none bg-transparent"
            description={
              query.trim()
                ? 'Try a different search term.'
                : 'Send a message to create your first conversation.'
            }
            icon={MessageSquare}
            title={query.trim() ? 'No conversations found' : 'No conversations yet'}
          />
        ) : (
          <ul className="space-y-1">
            {filteredSessions.map((session) => {
              const isActive = activeSessionId === session.id;
              return (
                <li key={session.id}>
                  <div
                    className={`group flex items-start gap-1 rounded-xl border px-2 py-2 transition-colors ${
                      isActive
                        ? 'border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80'
                        : 'border-transparent hover:border-zinc-200 hover:bg-white/80 dark:hover:border-zinc-800 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelectSession(session.id)}
                      type="button"
                    >
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {session.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {new Date(session.lastMessageAt ?? session.updatedAt).toLocaleString()}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                        {formatSessionModel(session) ?? 'model pending'}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        aria-label={`Rename ${session.title}`}
                        className="h-7 w-7"
                        onClick={() => onRenameSession(session)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        aria-label={`Delete ${session.title}`}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteSession(session)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
