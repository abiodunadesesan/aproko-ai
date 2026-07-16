import type { User } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeUserPreferences, type UserPreferences } from '@/lib/settings/preferences';

export type AppProfile = {
  id?: string;
  clerk_user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferences?: UserPreferences | Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type UpdateProfileInput = {
  full_name?: string | null;
  preferences?: UserPreferences;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isMissingProfilesTableError(error: unknown): boolean {
  const candidate = error as SupabaseErrorLike | null;
  if (!candidate) {
    return false;
  }

  return (
    candidate.code === 'PGRST205' &&
    typeof candidate.message === 'string' &&
    candidate.message.includes("Could not find the table 'public.profiles'")
  );
}

function withNormalizedPreferences(profile: AppProfile): AppProfile {
  return {
    ...profile,
    preferences: normalizeUserPreferences(profile.preferences),
  };
}

export async function syncProfileFromClerkUser(user: User): Promise<AppProfile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.warn('Supabase admin client not configured; skipping profile sync.');
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;

  const profilePayload = {
    clerk_user_id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    full_name: fullName,
    avatar_url: user.imageUrl ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'clerk_user_id' })
    .select('*')
    .single();

  if (error) {
    if (isMissingProfilesTableError(error)) {
      console.warn(
        'Profiles table is missing; skipping profile sync until migrations are applied.',
      );
      return null;
    }
    throw error;
  }

  return withNormalizedPreferences(data as AppProfile);
}

export async function getProfileByClerkUserId(clerkUserId: string): Promise<AppProfile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.warn('Supabase admin client not configured; skipping profile lookup.');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return withNormalizedPreferences(data as AppProfile);
}

export async function updateProfileByClerkUserId(
  clerkUserId: string,
  input: UpdateProfileInput,
): Promise<AppProfile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.warn('Supabase admin client not configured; skipping profile update.');
    return null;
  }

  const updatePayload: {
    full_name?: string | null;
    preferences?: UserPreferences;
  } = {};

  if (Object.hasOwn(input, 'full_name')) {
    const normalizedName = input.full_name?.trim() ?? null;
    updatePayload.full_name = normalizedName || null;
  }

  if (Object.hasOwn(input, 'preferences') && input.preferences) {
    updatePayload.preferences = normalizeUserPreferences(input.preferences);
  }

  if (Object.keys(updatePayload).length === 0) {
    return getProfileByClerkUserId(clerkUserId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('clerk_user_id', clerkUserId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return withNormalizedPreferences(data as AppProfile);
}
