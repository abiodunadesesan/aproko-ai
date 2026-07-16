import { auth } from '@clerk/nextjs/server';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { isAdminUser } from '@/lib/auth/admin';
import {
  getProfileByClerkUserId,
  updateProfileByClerkUserId,
  type AppProfile,
} from '@/lib/auth/profile-sync';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  parsePreferencesPatch,
  type UserPreferences,
} from '@/lib/settings/preferences';

type AuthDependency = () => Promise<{ userId: string | null }>;

type MeRouteDependencies = {
  auth: AuthDependency;
  getProfileByClerkUserId: typeof getProfileByClerkUserId;
  updateProfileByClerkUserId: typeof updateProfileByClerkUserId;
  isAdminUser: (userId: string | null) => boolean;
};

function toMePayload(userId: string, profile: AppProfile | null, isAdmin: boolean) {
  const preferences: UserPreferences = profile?.preferences
    ? normalizeUserPreferences(profile.preferences)
    : DEFAULT_USER_PREFERENCES;

  return {
    clerk_user_id: userId,
    profile: profile
      ? {
          ...profile,
          preferences,
        }
      : null,
    preferences,
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

        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.meWrite,
        });
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        const rawBody = (await request.json().catch(() => null)) as {
          full_name?: string;
          preferences?: unknown;
        } | null;

        if (!rawBody) {
          return Response.json({ error: 'Request body is required' }, { status: 400 });
        }

        const hasFullName = Object.hasOwn(rawBody, 'full_name');
        const hasPreferences = Object.hasOwn(rawBody, 'preferences');
        if (!hasFullName && !hasPreferences) {
          return Response.json(
            { error: 'Provide full_name and/or preferences to update' },
            { status: 400 },
          );
        }

        let preferences: UserPreferences | undefined;
        if (hasPreferences) {
          const parsed = parsePreferencesPatch(rawBody.preferences);
          if (!parsed.ok) {
            return Response.json({ error: parsed.error }, { status: 400 });
          }
          preferences = parsed.preferences;
        }

        const profile = await deps.updateProfileByClerkUserId(userId, {
          ...(hasFullName ? { full_name: rawBody.full_name ?? null } : {}),
          ...(preferences ? { preferences } : {}),
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
