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

function formatGenerationError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Unable to stream assistant response');
  }

  const parts = [error.message];
  let cause: unknown = (error as Error & { cause?: unknown }).cause;
  let depth = 0;
  while (cause instanceof Error && depth < 4) {
    if (cause.message && !parts.includes(cause.message)) {
      parts.push(cause.message);
    }
    cause = (cause as Error & { cause?: unknown }).cause;
    depth += 1;
  }

  const responseBody = (error as Error & { responseBody?: unknown }).responseBody;
  if (typeof responseBody === 'string' && responseBody.trim()) {
    parts.push(responseBody.trim().slice(0, 280));
  }

  const joined = parts.join(' — ');
  if (/invalid api key|incorrect api key|authentication|unauthorized|401/i.test(joined)) {
    return new Error(
      'Chat model authentication failed. Check GROQ_API_KEY (or the selected provider key) on the server.',
    );
  }
  if (/credit balance is too low|purchase credits|plans & billing/i.test(joined)) {
    return new Error(
      'Anthropic has no API credits. Add billing at console.anthropic.com, or switch to Groq.',
    );
  }
  if (/exceeded your current quota|insufficient_quota|429/i.test(joined)) {
    return new Error(
      'OpenAI quota exceeded. Add billing/credits at platform.openai.com, or switch to Groq.',
    );
  }

  return new Error(joined);
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

  async function* guardedTextStream(): AsyncIterable<string> {
    try {
      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      throw formatGenerationError(error);
    }
  }

  return {
    textStream: guardedTextStream(),
    fullText: (async () => {
      try {
        return await result.text;
      } catch (error) {
        throw formatGenerationError(error);
      }
    })(),
  };
}
