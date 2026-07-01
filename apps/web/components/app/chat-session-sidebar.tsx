'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, MoreHorizontal, Plus, Search } from 'lucide-react';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    <aside className="flex h-full min-h-[520px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="space-y-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <Button
          className="w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          onClick={onNewSession}
          type="button"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            aria-label="Search conversations"
            className="h-9 rounded-full border-zinc-200 bg-zinc-50 pl-9 dark:border-zinc-700 dark:bg-zinc-950"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            value={query}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            compact
            className="mx-1 border-none bg-transparent"
            description={
              query.trim()
                ? 'Try a different search term.'
                : 'Start a new chat to ask questions grounded in your library.'
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
                    className={`group flex items-start gap-1 rounded-lg border px-2 py-2 transition-colors ${
                      isActive
                        ? 'border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80'
                        : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900'
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Session actions for ${session.title}`}
                          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRenameSession(session)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDeleteSession(session)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
