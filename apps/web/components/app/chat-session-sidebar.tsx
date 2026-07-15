'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Pencil, Search, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  className?: string;
};

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  className,
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
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col border-r border-zinc-200/70 bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-[#171717]',
        className,
      )}
    >
      <div className="space-y-2 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            aria-label="Search conversations"
            className="h-9 rounded-full border-zinc-200/80 bg-white pl-9 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            value={query}
          />
        </div>
      </div>

      <div className="px-3 pb-1">
        <p className="px-2 text-[11px] font-medium text-zinc-500">Recents</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-1.5 p-1">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            className="mx-1 border-none bg-transparent"
            compact
            description={
              query.trim()
                ? 'Try a different search term.'
                : 'Your conversations will show up here.'
            }
            icon={MessageSquare}
            title={query.trim() ? 'No chats found' : 'No chats yet'}
          />
        ) : (
          <ul className="space-y-0.5">
            {filteredSessions.map((session) => {
              const isActive = activeSessionId === session.id;
              return (
                <li key={session.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors',
                      isActive
                        ? 'bg-zinc-200/90 dark:bg-zinc-800'
                        : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60',
                    )}
                  >
                    <button
                      className="min-w-0 flex-1 truncate text-left text-[13px] text-zinc-800 dark:text-zinc-200"
                      onClick={() => onSelectSession(session.id)}
                      type="button"
                    >
                      {session.title}
                    </button>
                    <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        aria-label={`Rename ${session.title}`}
                        className="h-7 w-7 text-zinc-500"
                        onClick={() => onRenameSession(session)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        aria-label={`Delete ${session.title}`}
                        className="h-7 w-7 text-zinc-500 hover:text-red-500"
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
