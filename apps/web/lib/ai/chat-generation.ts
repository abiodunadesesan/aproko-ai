import { streamText } from 'ai';
import {
  buildChatSystemPrompt,
  type ChatMemoryContext,
  type WorkspaceContextItem,
} from '@/lib/ai/chat-context';
import { isModelConfigured, resolveLanguageModel, type ChatModel } from '@/lib/ai/chat-models';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatGenerationInput = {
  model: ChatModel;
  userMessage: string;
  history: ChatHistoryMessage[];
  memoryContext: ChatMemoryContext[];
  workspaceContext: WorkspaceContextItem[];
};

export type ChatGenerationStream = {
  textStream: AsyncIterable<string>;
  fullText: Promise<string>;
};

export function canGenerateWithModel(model: ChatModel): boolean {
  return isModelConfigured(model);
}

export function streamAssistantGeneration(input: ChatGenerationInput): ChatGenerationStream {
  const result = streamText({
    model: resolveLanguageModel(input.model),
    system: buildChatSystemPrompt({
      memoryContext: input.memoryContext,
      workspaceContext: input.workspaceContext,
    }),
    messages: [
      ...input.history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user' as const, content: input.userMessage },
    ],
  });

  return {
    textStream: result.textStream,
    fullText: Promise.resolve(result.text),
  };
}
