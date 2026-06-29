import { auth, currentUser } from '@clerk/nextjs/server';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();

    if (!user) {
      return Response.json({ error: 'Unable to resolve current user' }, { status: 401 });
    }

    const profile = await syncProfileFromClerkUser(user);

    return Response.json(
      {
        synced: Boolean(profile),
        profile
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to sync session profile', error);
    return Response.json({ error: 'Failed to sync profile' }, { status: 500 });
  }
}
