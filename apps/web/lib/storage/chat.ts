import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type ChatContextMode = 'workspace';

export type ChatSession = {
  id: string;
  workspaceId: string;
  clerkUserId: string;
  title: string;
  contextMode: ChatContextMode;
  modelProvider: string | null;
  modelName: string | null;
  lastMessageAt: string | null;
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
  responseTransport: string;
  modelProvider: string | null;
  modelName: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreateChatMessageOptions = {
  responseTransport?: string;
  model?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

type DbSessionRow = {
  id: string;
  workspace_id: string;
  clerk_user_id: string;
  title: string;
  context_mode: ChatContextMode;
  model_provider: string | null;
  model_name: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbMessageRow = {
  id: string;
  workspace_id: string;
  session_id: string;
  role: ChatMessageRole;
  content: string;
  response_transport: string | null;
  model_provider: string | null;
  model_name: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function parseModel(model: string | undefined): {
  modelProvider: string | null;
  modelName: string | null;
} {
  if (!model) {
    return { modelProvider: null, modelName: null };
  }
  const [provider, ...rest] = model.split(':');
  if (!provider || rest.length === 0) {
    return { modelProvider: null, modelName: null };
  }
  return { modelProvider: provider, modelName: rest.join(':') || null };
}

function toSession(row: DbSessionRow): ChatSession {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clerkUserId: row.clerk_user_id,
    title: row.title,
    contextMode: row.context_mode,
    modelProvider: row.model_provider,
    modelName: row.model_name,
    lastMessageAt: row.last_message_at,
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
    responseTransport: row.response_transport ?? 'sse',
    modelProvider: row.model_provider,
    modelName: row.model_name,
    status: row.status ?? 'completed',
    metadata: row.metadata ?? {},
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
    .select(
      'id, workspace_id, clerk_user_id, title, context_mode, model_provider, model_name, last_message_at, created_at, updated_at',
    )
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
): Promise<ChatSession> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      'Chat storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.',
    );
  }

  const sessionTitle = title.trim() || 'New chat';
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      workspace_id: workspaceId,
      clerk_user_id: clerkUserId,
      title: sessionTitle,
      context_mode: contextMode,
      model_provider: null,
      model_name: null,
      last_message_at: null,
    })
    .select(
      'id, workspace_id, clerk_user_id, title, context_mode, model_provider, model_name, last_message_at, created_at, updated_at',
    )
    .single();

  if (error || !data) {
    console.warn('Unable to create chat session.', error?.message ?? 'unknown_error');
    throw new Error(
      error?.message
        ? `Failed to create chat session: ${error.message}`
        : 'Failed to create chat session',
    );
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
    .select(
      'id, workspace_id, clerk_user_id, title, context_mode, model_provider, model_name, last_message_at, created_at, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toSession(data as DbSessionRow);
}

export async function updateChatSessionTitle(
  workspaceId: string,
  clerkUserId: string,
  sessionId: string,
  titleRaw: string,
): Promise<ChatSession | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const title = titleRaw.trim();
  if (!title) {
    return null;
  }

  const { data, error } = await supabase
    .from('conversations')
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', sessionId)
    .select(
      'id, workspace_id, clerk_user_id, title, context_mode, model_provider, model_name, last_message_at, created_at, updated_at',
    )
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to update chat session title.', error?.message ?? 'session_not_found');
    return null;
  }

  return toSession(data as DbSessionRow);
}

export async function deleteChatSession(
  workspaceId: string,
  clerkUserId: string,
  sessionId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', sessionId);

  if (error) {
    console.warn('Unable to delete chat session.', error.message);
    return false;
  }

  return true;
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
    .select(
      'id, workspace_id, session_id, role, content, response_transport, model_provider, model_name, status, metadata, created_at',
    )
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
  options: CreateChatMessageOptions = {},
): Promise<ChatMessage | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return null;
  }

  const { modelProvider, modelName } = parseModel(options.model);
  const responseTransport = options.responseTransport ?? 'sse';
  const status = options.status ?? 'completed';
  const metadata = options.metadata ?? {};

  const { data, error } = await supabase
    .from('messages')
    .insert({
      workspace_id: workspaceId,
      session_id: sessionId,
      role,
      content: normalizedContent,
      response_transport: responseTransport,
      model_provider: modelProvider,
      model_name: modelName,
      status,
      metadata,
    })
    .select(
      'id, workspace_id, session_id, role, content, response_transport, model_provider, model_name, status, metadata, created_at',
    )
    .single();

  if (error || !data) {
    console.warn('Unable to create chat message.', error?.message ?? 'unknown_error');
    return null;
  }

  const nowIso = new Date().toISOString();
  const { error: touchError } = await supabase
    .from('conversations')
    .update({
      updated_at: nowIso,
      last_message_at: nowIso,
      ...(modelProvider ? { model_provider: modelProvider } : {}),
      ...(modelName ? { model_name: modelName } : {}),
    })
    .eq('workspace_id', workspaceId)
    .eq('id', sessionId);

  if (touchError) {
    console.warn('Unable to update chat session timestamp.', touchError.message);
  }

  return toMessage(data as DbMessageRow);
}
