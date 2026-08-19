export function extensionAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ext.${token}`;
  }
  return headers;
}

/** Flat extension chat endpoint — resolves workspace from bearer/cookies server-side. */
export const EXTENSION_LIVE_CONTEXT_CHAT_PATH = '/api/v1/extension/live-context/chat';

export function workspaceLiveContextChatPath(workspaceId: string): string {
  return `/api/v1/workspaces/${workspaceId}/live-context/chat`;
}

export async function fetchExtensionSession(token: string): Promise<{
  workspaceId: string;
  name: string | null;
  role: string | null;
  planCode?: string;
  liveContextCompanion?: boolean;
} | null> {
  const response = await fetch('/api/v1/extension/session', {
    headers: {
      ...extensionAuthHeaders(token),
      Accept: 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: {
      workspaceId?: string;
      name?: string;
      role?: string;
      planCode?: string;
      liveContextCompanion?: boolean;
    };
    error?: string;
  };

  if (!response.ok || !payload.data?.workspaceId) {
    return null;
  }

  return {
    workspaceId: payload.data.workspaceId,
    name: payload.data.name ?? null,
    role: payload.data.role ?? null,
    planCode: payload.data.planCode,
    liveContextCompanion: payload.data.liveContextCompanion,
  };
}
