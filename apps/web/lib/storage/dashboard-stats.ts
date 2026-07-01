import { listChatSessions } from '@/lib/storage/chat';
import { listLibrarySources } from '@/lib/storage/library';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const WORKSPACE_ID = 'default-workspace';

export type DashboardActivityStatus = 'Indexed' | 'Synced' | 'Ranked' | 'Active';

export type DashboardActivityItem = {
  id: string;
  item: string;
  type: string;
  status: DashboardActivityStatus;
  updatedAt: string;
  updatedLabel: string;
};

export type DashboardStats = {
  sourceCount: number;
  sourcesThisWeek: number;
  memoryCount: number;
  studyItemCount: number;
  chatSessionCount: number;
  studyStreakDays: number;
  recentActivity: DashboardActivityItem[];
};

function formatRelativeTime(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

function isWithinDays(isoDate: string | null | undefined, days: number): boolean {
  if (!isoDate) {
    return false;
  }
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

function computeStudyStreak(dates: string[]): number {
  if (!dates.length) {
    return 0;
  }

  const dayKeys = new Set(
    dates
      .map((value) => Date.parse(value))
      .filter((value) => !Number.isNaN(value))
      .map((value) => new Date(value).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dayKeys.has(key)) {
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function getWorkspaceDashboardStats(
  workspaceId: string = WORKSPACE_ID,
  clerkUserId: string | null,
): Promise<DashboardStats> {
  const supabase = getSupabaseAdminClient();
  const [sources, sessions] = await Promise.all([
    listLibrarySources(workspaceId),
    clerkUserId ? listChatSessions(workspaceId, clerkUserId) : Promise.resolve([]),
  ]);

  const sourceCount = sources.length;
  const sourcesThisWeek = sources.filter((source) => isWithinDays(source.updatedAt, 7)).length;
  const chatSessionCount = sessions.length;

  let memoryCount = 0;
  let studyItemCount = 0;
  const activityDates: string[] = [];
  const recentActivity: DashboardActivityItem[] = [];

  if (supabase) {
    const [
      memoryResult,
      memoryCountResult,
      notesResult,
      decksResult,
      quizzesResult,
      attemptsResult,
    ] = await Promise.all([
      supabase
        .from('memory_items')
        .select('id, content, updated_at, created_at')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('memory_items')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('notes')
        .select('id, title, updated_at, created_at')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('flashcard_decks')
        .select('id, title, updated_at, created_at')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('quizzes')
        .select('id, title, updated_at, created_at')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('quiz_attempts')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (!memoryCountResult.error && typeof memoryCountResult.count === 'number') {
      memoryCount = memoryCountResult.count;
    }

    if (!memoryResult.error && memoryResult.data) {
      for (const row of memoryResult.data) {
        const summary =
          (row.content as { summary?: string } | null)?.summary?.trim() || 'Memory item';
        const updatedAt = row.updated_at ?? row.created_at;
        recentActivity.push({
          id: `memory-${row.id}`,
          item: summary.slice(0, 80),
          type: 'Memory',
          status: 'Ranked',
          updatedAt,
          updatedLabel: formatRelativeTime(updatedAt),
        });
      }
    }

    const notes = notesResult.data ?? [];
    const decks = decksResult.data ?? [];
    const quizzes = quizzesResult.data ?? [];
    studyItemCount = notes.length + decks.length + quizzes.length;

    for (const row of notes) {
      activityDates.push(row.updated_at ?? row.created_at);
      recentActivity.push({
        id: `note-${row.id}`,
        item: row.title?.trim() || 'Untitled note',
        type: 'Note',
        status: 'Synced',
        updatedAt: row.updated_at ?? row.created_at,
        updatedLabel: formatRelativeTime(row.updated_at ?? row.created_at),
      });
    }

    for (const row of decks) {
      activityDates.push(row.updated_at ?? row.created_at);
    }

    for (const row of quizzes) {
      activityDates.push(row.updated_at ?? row.created_at);
    }

    for (const row of attemptsResult.data ?? []) {
      activityDates.push(row.created_at);
    }
  }

  for (const source of sources.slice(0, 8)) {
    const updatedAt = source.updatedAt ?? new Date(0).toISOString();
    recentActivity.push({
      id: `source-${source.id}`,
      item: source.name,
      type: 'Source',
      status: 'Indexed',
      updatedAt,
      updatedLabel: formatRelativeTime(updatedAt),
    });
  }

  for (const session of sessions.slice(0, 8)) {
    const updatedAt = session.lastMessageAt ?? session.updatedAt;
    recentActivity.push({
      id: `chat-${session.id}`,
      item: session.title,
      type: 'Chat',
      status: 'Active',
      updatedAt,
      updatedLabel: formatRelativeTime(updatedAt),
    });
  }

  recentActivity.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return {
    sourceCount,
    sourcesThisWeek,
    memoryCount,
    studyItemCount,
    chatSessionCount,
    studyStreakDays: computeStudyStreak(activityDates),
    recentActivity: recentActivity.slice(0, 8),
  };
}
