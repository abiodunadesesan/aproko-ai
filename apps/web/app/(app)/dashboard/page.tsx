import { AppPageShell } from '@/components/app/app-page-shell';
import { DashboardHome } from '@/components/app/dashboard-home';
import {
  getWorkspaceDashboardStats,
  type DashboardStats,
} from '@/lib/storage/dashboard-stats';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';
import { auth, currentUser } from '@clerk/nextjs/server';

const emptyStats: DashboardStats = {
  sourceCount: 0,
  sourcesThisWeek: 0,
  memoryCount: 0,
  studyItemCount: 0,
  chatSessionCount: 0,
  studyStreakDays: 0,
  recentActivity: [],
};

export default async function DashboardPage() {
  const { userId } = await auth();
  let user = null;

  try {
    user = await currentUser();
  } catch (error) {
    console.error('Dashboard user lookup failed', error);
  }

  let profileSynced = false;

  if (userId && user) {
    try {
      await syncProfileFromClerkUser(user);
      profileSynced = true;
    } catch (error) {
      console.error('Dashboard profile sync failed', error);
    }
  }

  let stats = emptyStats;
  try {
    const workspace = userId ? await resolveWorkspaceForUser(userId) : null;
    if (workspace) {
      stats = await getWorkspaceDashboardStats(workspace.workspaceId, userId);
    }
  } catch (error) {
    console.error('Dashboard stats load failed', error);
  }

  const displayName =
    user?.firstName?.trim() ||
    user?.fullName?.trim()?.split(/\s+/)[0] ||
    null;

  return (
    <AppPageShell pageId="dashboard">
      <DashboardHome
        displayName={displayName}
        profileSynced={profileSynced}
        stats={stats}
        userId={userId}
      />
    </AppPageShell>
  );
}
