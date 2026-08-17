import { isChatModel, normalizeChatModel, type ChatModel } from '@/lib/ai/chat-models';

export type UserPreferences = {
  defaultChatModel: ChatModel;
  autoMemoryCapture: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultChatModel: 'groq:openai/gpt-oss-20b',
  autoMemoryCapture: true,
};

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const modelCandidate = typeof source.defaultChatModel === 'string' ? source.defaultChatModel : '';
  const defaultChatModel =
    normalizeChatModel(modelCandidate) ?? DEFAULT_USER_PREFERENCES.defaultChatModel;

  const autoMemoryCapture =
    typeof source.autoMemoryCapture === 'boolean'
      ? source.autoMemoryCapture
      : DEFAULT_USER_PREFERENCES.autoMemoryCapture;

  return {
    defaultChatModel,
    autoMemoryCapture,
  };
}

export function parsePreferencesPatch(
  raw: unknown,
): { ok: true; preferences: UserPreferences } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'preferences must be an object' };
  }

  const source = raw as Record<string, unknown>;
  if (Object.hasOwn(source, 'defaultChatModel')) {
    if (typeof source.defaultChatModel !== 'string' || !isChatModel(source.defaultChatModel)) {
      return { ok: false, error: 'defaultChatModel is invalid' };
    }
  }
  if (Object.hasOwn(source, 'autoMemoryCapture') && typeof source.autoMemoryCapture !== 'boolean') {
    return { ok: false, error: 'autoMemoryCapture must be a boolean' };
  }

  return { ok: true, preferences: normalizeUserPreferences(source) };
}
