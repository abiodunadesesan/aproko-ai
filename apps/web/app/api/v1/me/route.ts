import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/auth/admin';
import {
  getProfileByClerkUserId,
  updateProfileByClerkUserId,
  type AppProfile,
} from '@/lib/auth/profile-sync';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type MeRouteDependencies = {
  auth: AuthDependency;
  getProfileByClerkUserId: typeof getProfileByClerkUserId;
  updateProfileByClerkUserId: typeof updateProfileByClerkUserId;
  isAdminUser: (userId: string | null) => boolean;
};

function toMePayload(userId: string, profile: AppProfile | null, isAdmin: boolean) {
  return {
    clerk_user_id: userId,
    profile,
    isAdmin,
  };
}

export function createMeRouteHandlers(deps: MeRouteDependencies) {
  return {
    GET: async () => {
      const startedAtMs = Date.now();
      try {
        const { userId } = await deps.auth();

        if (!userId) {
          return withPerformanceHeaders(
            Response.json({ error: 'Unauthorized' }, { status: 401 }),
            startedAtMs,
          );
        }

        const profile = await deps.getProfileByClerkUserId(userId);
        return withPerformanceHeaders(
          Response.json(toMePayload(userId, profile, deps.isAdminUser(userId)), { status: 200 }),
          startedAtMs,
          {
            cacheControl: 'private, max-age=15, stale-while-revalidate=60',
          },
        );
      } catch (error) {
        captureServerError(error, { route: '/api/v1/me', action: 'get_profile' });
        return withPerformanceHeaders(
          Response.json({ error: 'Failed to fetch profile' }, { status: 500 }),
          startedAtMs,
        );
      }
    },

    PATCH: async (request: Request) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rawBody = (await request.json().catch(() => null)) as { full_name?: string } | null;
        if (!rawBody || !Object.hasOwn(rawBody, 'full_name')) {
          return Response.json({ error: 'full_name is required' }, { status: 400 });
        }

        const profile = await deps.updateProfileByClerkUserId(userId, {
          full_name: rawBody.full_name ?? null,
        });

        if (!profile) {
          return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        return Response.json(toMePayload(userId, profile, deps.isAdminUser(userId)), {
          status: 200,
        });
      } catch (error) {
        captureServerError(error, { route: '/api/v1/me', action: 'patch_profile' });
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    },
  };
}

export const { GET, PATCH } = createMeRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getProfileByClerkUserId,
  updateProfileByClerkUserId,
  isAdminUser,
});
