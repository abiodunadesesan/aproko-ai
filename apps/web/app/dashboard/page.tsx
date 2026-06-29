import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from '@aproko/ui';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';
import { AppShell } from '@/components/app-shell';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  let profileSynced = false;

  if (userId && user) {
    try {
      await syncProfileFromClerkUser(user);
      profileSynced = true;
    } catch (error) {
      console.error('Dashboard profile sync failed', error);
    }
  }

  return (
    <AppShell
      subtitle="Foundation shell ready. Sprint 1 focuses on navigation quality, responsive layout, and reusable structure."
      title="Dashboard"
    >
      <section className="space-y-4">
        <div className={cardClass}>
          <p className="text-sm font-medium">Workspace is ready</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in and using the authenticated shell. Next tickets will progressively
            activate chat, memory, and study modules.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className={buttonPrimaryClass} href="/library">
              Open Library
            </Link>
            <button className={buttonSecondaryClass} type="button">
              New Chat (Soon)
            </button>
          </div>
        </div>

        <div className={cardClass}>
          <p className="text-sm">
            Clerk user: {userId ?? 'unknown'} | Profile sync: {profileSynced ? 'ok' : 'pending'}
          </p>
        </div>
      </section>
    </AppShell>
  );
}
