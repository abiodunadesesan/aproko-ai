'use client';

import type { RefObject } from 'react';
import { ArrowUp, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ChatPromptInputProps = {
  input: string;
  error: string | null;
  isSending: boolean;
  isListening: boolean;
  isTranscribingVoice: boolean;
  onChange: (value: string) => void;
  onToggleVoice: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatPromptInput({
  input,
  error,
  isSending,
  isListening,
  isTranscribingVoice,
  onChange,
  onToggleVoice,
  textareaRef,
}: ChatPromptInputProps) {
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
            className="h-11 w-11 rounded-full text-zinc-600 sm:h-9 sm:w-9 dark:text-zinc-300"
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
              'h-11 w-11 rounded-full sm:h-9 sm:w-9',
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
