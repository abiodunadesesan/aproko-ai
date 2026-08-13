'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { cn } from '@/lib/utils';

export type ChatThreadCitation = {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'workspace-source' | 'note' | 'memory' | 'transcript';
};

export type ChatThreadMemoryContext = {
  memoryItemId: string;
  summary: string;
};

export type ChatThreadMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: string;
  citations?: ChatThreadCitation[];
  memoryContext?: ChatThreadMemoryContext[];
};

type ChatMessageThreadProps = {
  messages: ChatThreadMessage[];
  isSending: boolean;
  className?: string;
};

export function ChatMessageThread({ messages, isSending, className }: ChatMessageThreadProps) {
  return (
    <Conversation className={cn('min-h-0 flex-1', className)}>
      <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 md:px-6">
        {messages.map((message) => {
          if (message.role === 'user') {
            return (
              <Message data-testid="chat-user-message" from="user" key={message.id}>
                <MessageContent>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </MessageContent>
              </Message>
            );
          }

          if (message.role !== 'assistant') {
            return null;
          }

          const isStreaming =
            message.status === 'streaming' && isSending && message.id.startsWith('temp-assistant');

          return (
            <Message
              className="max-w-none w-full"
              data-testid="chat-assistant-message"
              from="assistant"
              key={message.id}
            >
              <MessageContent className="w-full max-w-none">
                {message.memoryContext?.length ? (
                  <div className="mb-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
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

                <MessageResponse isAnimating={isStreaming}>
                  {message.content || (isSending ? '…' : '')}
                </MessageResponse>

                {message.citations?.length ? (
                  <Sources className="mt-4 text-zinc-600 dark:text-zinc-300">
                    <SourcesTrigger count={message.citations.length} />
                    <SourcesContent>
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
                          <p className="mt-1 text-xs text-zinc-500">{citation.snippet}</p>
                        </div>
                      ))}
                    </SourcesContent>
                  </Sources>
                ) : null}
              </MessageContent>
            </Message>
          );
        })}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
