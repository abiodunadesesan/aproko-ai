-- AUTH-002 migration baseline (spec)
-- Purpose: Ensure profiles table is keyed by Clerk external user identity.

alter table if exists profiles
  add column if not exists clerk_user_id text;

update profiles
set clerk_user_id = coalesce(clerk_user_id, id::text)
where clerk_user_id is null;

alter table if exists profiles
  alter column clerk_user_id set not null;

create unique index if not exists profiles_clerk_user_id_key
  on profiles (clerk_user_id);

-- Optional hygiene: remove legacy auth linkage once fully migrated.
-- alter table profiles drop column if exists legacy_auth_user_id;
