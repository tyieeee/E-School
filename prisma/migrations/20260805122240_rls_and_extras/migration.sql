-- Postgres/Supabase-specific pieces Prisma's schema language can't express:
-- check constraints, the FK into Supabase's own auth.users table, RLS
-- policies, the is_admin() helper, storage bucket + policies, and Realtime.

-- ---------------------------------------------------------------------
-- Check constraints
-- ---------------------------------------------------------------------

alter table profiles add constraint profiles_role_check check (role in ('admin', 'student'));
alter table reports add constraint reports_type_check check (type in ('bullying', 'weapon', 'other'));
alter table reports add constraint reports_status_check check (status in ('new', 'reviewing', 'resolved', 'escalated'));

-- ---------------------------------------------------------------------
-- profiles.id -> auth.users.id (Supabase Auth's own table, not managed
-- by Prisma)
-- ---------------------------------------------------------------------

alter table profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- ---------------------------------------------------------------------
-- Helper: is_admin() — SECURITY DEFINER so it can read `profiles`
-- without recursively re-triggering RLS on the calling policy.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table reports enable row level security;
alter table announcements enable row level security;
alter table direct_messages enable row level security;
alter table urgent_warnings enable row level security;
alter table audit_log enable row level security;

-- profiles: students see/manage only their own row, admins see/manage all.
-- Row creation happens exclusively through the manage-student Edge
-- Function (service role), so there is no INSERT policy for regular
-- clients.
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- Students may only ever change their own contact number / password flag /
-- name — never their own role or student_number. Admins get full column
-- access so they can manage accounts.
revoke update on profiles from authenticated;
grant update (contact_number, must_change_password, full_name) on profiles to authenticated;

create policy "profiles_delete_admin" on profiles
  for delete using (is_admin());

-- reports: students insert/read their own; admins read/update all.
create policy "reports_insert_own" on reports
  for insert with check (student_id = auth.uid());

create policy "reports_select_own_or_admin" on reports
  for select using (student_id = auth.uid() or is_admin());

create policy "reports_update_admin" on reports
  for update using (is_admin()) with check (is_admin());

-- announcements: everyone signed in can read; only admins write.
create policy "announcements_select_all" on announcements
  for select using (auth.uid() is not null);

create policy "announcements_write_admin" on announcements
  for all using (is_admin()) with check (is_admin());

-- direct_messages: student reads/marks-read own; admin reads/writes all.
create policy "dm_select_own_or_admin" on direct_messages
  for select using (student_id = auth.uid() or is_admin());

create policy "dm_insert_admin" on direct_messages
  for insert with check (is_admin());

create policy "dm_update_own_or_admin" on direct_messages
  for update using (student_id = auth.uid() or is_admin())
  with check (student_id = auth.uid() or is_admin());

revoke update on direct_messages from authenticated;
grant update (read) on direct_messages to authenticated;

-- urgent_warnings: everyone signed in can read; only admins write.
create policy "warnings_select_all" on urgent_warnings
  for select using (auth.uid() is not null);

create policy "warnings_write_admin" on urgent_warnings
  for all using (is_admin()) with check (is_admin());

-- audit_log: admin only, both directions.
create policy "audit_admin_only" on audit_log
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Storage: private bucket for report photo evidence.
-- Students may upload only under a path prefixed with their own user id
-- (e.g. `${auth.uid()}/1699999999-photo.jpg`); only admins can read/list,
-- via signed URLs generated from the admin dashboard.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

create policy "report_evidence_student_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "report_evidence_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'report-evidence' and is_admin());

create policy "report_evidence_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Realtime: broadcast changes for instant urgent warnings, announcements,
-- and direct messages.
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'urgent_warnings'
  ) then
    alter publication supabase_realtime add table urgent_warnings;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table announcements;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table direct_messages;
  end if;
end $$;