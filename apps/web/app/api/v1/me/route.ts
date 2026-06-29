import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkUserId } from '@/lib/auth/profile-sync';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkUserId(userId);

    return Response.json(
      {
        clerk_user_id: userId,
        profile
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch profile', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
