import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type ChatContextMode = 'workspace';

export type ChatSession = {
  id: string;
  workspaceId: string;
  clerkUserId: string;
  title: string;
  contextMode: ChatContextMode;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  workspaceId: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

type DbSessionRow = {
  id: string;
  workspace_id: string;
  clerk_user_id: string;
  title: string;
  context_mode: ChatContextMode;
  created_at: string;
  updated_at: string;
};

type DbMessageRow = {
  id: string;
  workspace_id: string;
  session_id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
};

function toSession(row: DbSessionRow): ChatSession {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clerkUserId: row.clerk_user_id,
    title: row.title,
    contextMode: row.context_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: DbMessageRow): ChatMessage {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listChatSessions(
  workspaceId: string,
  clerkUserId: string,
): Promise<ChatSession[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id, workspace_id, clerk_user_id, title, context_mode, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Unable to list chat sessions.', error.message);
    return [];
  }

  return ((data ?? []) as DbSessionRow[]).map(toSession);
}

export async function createChatSession(
  workspaceId: string,
  clerkUserId: string,
  title: string,
  contextMode: ChatContextMode = 'workspace',
): Promise<ChatSession | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const sessionTitle = title.trim() || 'New chat';
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      workspace_id: workspaceId,
      clerk_user_id: clerkUserId,
      title: sessionTitle,
      context_mode: contextMode,
    })
    .select('id, workspace_id, clerk_user_id, title, context_mode, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create chat session.', error?.message ?? 'unknown_error');
    return null;
  }

  return toSession(data as DbSessionRow);
}

export async function getChatSessionById(
  workspaceId: string,
  clerkUserId: string,
  sessionId: string,
): Promise<ChatSession | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id, workspace_id, clerk_user_id, title, context_mode, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toSession(data as DbSessionRow);
}

export async function listChatMessages(
  workspaceId: string,
  clerkUserId: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const session = await getChatSessionById(workspaceId, clerkUserId, sessionId);
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, workspace_id, session_id, role, content, created_at')
    .eq('workspace_id', workspaceId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    console.warn('Unable to list chat messages.', error.message);
    return [];
  }

  return ((data ?? []) as DbMessageRow[]).map(toMessage);
}

export async function createChatMessage(
  workspaceId: string,
  sessionId: string,
  role: ChatMessageRole,
  content: string,
): Promise<ChatMessage | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return null;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      workspace_id: workspaceId,
      session_id: sessionId,
      role,
      content: normalizedContent,
    })
    .select('id, workspace_id, session_id, role, content, created_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create chat message.', error?.message ?? 'unknown_error');
    return null;
  }

  const { error: touchError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('id', sessionId);

  if (touchError) {
    console.warn('Unable to update chat session timestamp.', touchError.message);
  }

  return toMessage(data as DbMessageRow);
}
