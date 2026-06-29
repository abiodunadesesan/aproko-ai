import { auth, currentUser } from '@clerk/nextjs/server';
import { cardClass } from '@aproko/ui';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';

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
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-r p-4">
        <nav className="space-y-2 text-sm">
          <div className="font-semibold">Home</div>
          <div>Chat</div>
          <div>Library</div>
          <div>Memory</div>
          <div>Research</div>
          <div>Study</div>
          <div>Settings</div>
        </nav>
      </aside>
      <section className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Foundation shell ready. Sprint 1 will progressively add activity, uploads, and quick actions.
        </p>
        <div className={cardClass}>
          Clerk user: {userId ?? 'unknown'} | Profile sync: {profileSynced ? 'ok' : 'pending'}
        </div>
      </section>
    </main>
  );
}
