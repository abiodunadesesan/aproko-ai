'use client';

import type { RefObject } from 'react';
import { Mic, Square } from 'lucide-react';
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';

type ChatPromptInputProps = {
  input: string;
  error: string | null;
  isSending: boolean;
  isListening: boolean;
  isTranscribingVoice: boolean;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
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
  onSubmit,
  onToggleVoice,
  textareaRef,
}: ChatPromptInputProps) {
  const canSend = Boolean(input.trim()) && !isSending;

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim() ?? '';
    if (!text || isSending) {
      return;
    }
    onSubmit(text);
  };

  return (
    <div className="space-y-2">
      <PromptInput
        className="rounded-[28px] border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 [&_[data-slot=input-group]]:rounded-[28px] [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent"
        onSubmit={handleSubmit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-[44px] px-2 py-2.5 text-[15px]"
            data-testid="chat-input"
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ask anything"
            ref={textareaRef}
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter className="px-2 pb-2">
          <PromptInputTools>
            <PromptInputButton
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className="h-11 w-11 rounded-full text-zinc-600 sm:h-9 sm:w-9 dark:text-zinc-300"
              disabled={isSending || isTranscribingVoice}
              onClick={onToggleVoice}
              size="icon-sm"
              tooltip={isListening ? 'Stop voice input' : 'Start voice input'}
              type="button"
              variant="ghost"
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit
            aria-label="Send message"
            className="h-11 w-11 rounded-full sm:h-9 sm:w-9"
            data-testid="chat-send"
            disabled={!canSend}
            size="icon-sm"
            {...(isSending ? { status: 'submitted' as const } : {})}
          />
        </PromptInputFooter>
      </PromptInput>
      {error ? <p className="px-2 text-sm text-destructive">{error}</p> : null}
      <p className="px-2 text-center text-[11px] text-zinc-400">
        Aproko can make mistakes. Check citations against your sources.
      </p>
    </div>
  );
}
