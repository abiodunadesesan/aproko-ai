import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type ChatModel =
  | 'openai:gpt-4o-mini'
  | 'anthropic:claude-sonnet-5'
  | 'google:gemini-3.5-flash'
  | 'groq:llama-3.1-8b-instant';

const CHAT_MODELS: ChatModel[] = [
  'openai:gpt-4o-mini',
  'anthropic:claude-sonnet-5',
  'google:gemini-3.5-flash',
  'groq:llama-3.1-8b-instant',
];

export function isChatModel(value: string): value is ChatModel {
  return CHAT_MODELS.includes(value as ChatModel);
}

export function listChatModels(): ChatModel[] {
  return [...CHAT_MODELS];
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
    case 'groq':
      return Boolean(process.env.GROQ_API_KEY?.trim());
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
    case 'groq':
      return groq(modelName);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}
