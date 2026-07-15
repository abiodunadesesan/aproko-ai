import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type ChatModel =
  'openai:gpt-4o-mini' | 'anthropic:claude-3-5-sonnet' | 'google:gemini-1.5-pro';

const CHAT_MODELS: ChatModel[] = [
  'openai:gpt-4o-mini',
  'anthropic:claude-3-5-sonnet',
  'google:gemini-1.5-pro',
];

export function isChatModel(value: string): value is ChatModel {
  return CHAT_MODELS.includes(value as ChatModel);
}

export function getConfiguredChatModels(): ChatModel[] {
  return CHAT_MODELS.filter(isModelConfigured);
}

export function isModelConfigured(model: ChatModel): boolean {
  const provider = model.split(':')[0];
  switch (provider) {
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    case 'google':
      return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
    default:
      return false;
  }
}

export function resolveLanguageModel(model: ChatModel): LanguageModel {
  if (!isModelConfigured(model)) {
    throw new Error(`Model ${model} is not configured. Add the provider API key on the server.`);
  }

  const [provider, ...rest] = model.split(':');
  const modelName = rest.join(':');

  switch (provider) {
    case 'openai':
      return openai(modelName);
    case 'anthropic':
      return anthropic(modelName);
    case 'google':
      return google(modelName);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}
