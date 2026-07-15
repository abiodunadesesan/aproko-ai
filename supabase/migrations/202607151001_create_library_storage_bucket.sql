-- Library file storage bucket for Aproko AI (used by apps/web/lib/storage/library.ts)
insert into storage.buckets (id, name, public)
values ('aproko-library', 'aproko-library', false)
on conflict (id) do update
set public = excluded.public;

-- Allow service-role uploads/reads (server-side API routes use SUPABASE_SERVICE_ROLE_KEY).
drop policy if exists "Service role full access to aproko-library" on storage.objects;
create policy "Service role full access to aproko-library"
on storage.objects
for all
to service_role
using (bucket_id = 'aproko-library')
with check (bucket_id = 'aproko-library');
