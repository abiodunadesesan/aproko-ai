import { streamText } from 'ai';
import {
  formatGenerationError,
  type ChatGenerationStream,
} from '@/lib/ai/chat-generation';
import {
  DEFAULT_CHAT_MODEL,
  getConfiguredChatModels,
  isModelConfigured,
  normalizeChatModel,
  resolveLanguageModel,
  type ChatModel,
} from '@/lib/ai/chat-models';
import {
  buildLiveContextSystemPrompt,
  type SanitizedLiveBrowserContext,
} from '@/lib/live-context/sanitize';

export function canGenerateLiveContext(model: ChatModel): boolean {
  return isModelConfigured(model);
}

/** Prefer an explicitly requested configured model, else Groq, else app default, else any. */
export function resolveLiveContextModel(requested?: string | null): ChatModel | null {
  const normalized = normalizeChatModel(requested);
  if (normalized && isModelConfigured(normalized)) {
    return normalized;
  }

  const groqModel: ChatModel = 'groq:openai/gpt-oss-20b';
  if (isModelConfigured(groqModel)) {
    return groqModel;
  }
  if (isModelConfigured(DEFAULT_CHAT_MODEL)) {
    return DEFAULT_CHAT_MODEL;
  }
  return getConfiguredChatModels()[0] ?? null;
}

export function streamLiveContextGeneration(input: {
  model: ChatModel;
  context: SanitizedLiveBrowserContext;
}): ChatGenerationStream {
  const result = streamText({
    model: resolveLanguageModel(input.model),
    system: buildLiveContextSystemPrompt(input.context),
    messages: [{ role: 'user', content: input.context.userQuery }],
  });

  let resolveFullText: ((value: string) => void) | null = null;
  let rejectFullText: ((reason: Error) => void) | null = null;
  const fullText = new Promise<string>((resolve, reject) => {
    resolveFullText = resolve;
    rejectFullText = reject;
  });

  async function* guardedTextStream(): AsyncIterable<string> {
    let accumulated = '';
    try {
      for await (const chunk of result.textStream) {
        accumulated += chunk;
        yield chunk;
      }
      resolveFullText?.(accumulated);
    } catch (error) {
      const formatted = formatGenerationError(error);
      rejectFullText?.(formatted);
      throw formatted;
    }
  }

  return {
    textStream: guardedTextStream(),
    fullText,
  };
}
