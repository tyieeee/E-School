-- =========================================================================
-- E-School Supabase schema
-- Run this whole file once in the Supabase SQL editor (or via `supabase db
-- push` if you keep it under supabase/migrations). Safe to re-run: guarded
-- with IF NOT EXISTS / OR REPLACE where practical.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('admin','student')),
  full_name text,
  student_number text unique,
  section_id uuid,
  contact_number text,
  contact_number_verified boolean not null default false, -- set client-side right after a successful Supabase phone OTP verifyOtp
  contact_email text, -- optional secondary contact email, distinct from the auth login email
  avatar_url text, -- public URL into the 'avatars' storage bucket
  must_change_password boolean not null default true,
  reports_passcode_hash text, -- SHA-256 hex of the student's "My Reports" view passcode
  passcode_reset_requested_at timestamptz, -- set by the student when they forget their reports passcode; cleared once an Admin resets it
  can_reply_to_admin boolean not null default false, -- only an Admin can flip this (see set_reply_access)
  reply_requested_at timestamptz, -- set by the student when they ask for reply access; cleared once an Admin decides
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists reports_passcode_hash text;
alter table profiles add column if not exists can_reply_to_admin boolean not null default false;
alter table profiles add column if not exists reply_requested_at timestamptz;
alter table profiles add column if not exists passcode_reset_requested_at timestamptz;
alter table profiles add column if not exists contact_number_verified boolean not null default false;
alter table profiles add column if not exists contact_email text;
alter table profiles add column if not exists avatar_url text;
alter table reports add column if not exists photo_paths text[] not null default '{}';

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('bullying','weapon','other')),
  description text not null,
  photo_path text, -- deprecated: single-photo legacy column, superseded by photo_paths
  photo_paths text[] not null default '{}', -- storage object paths in the report-evidence bucket, up to 3
  location text,
  status text not null default 'new' check (status in ('new','reviewing','resolved','escalated')),
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  pinned boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid references profiles(id),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists urgent_warnings (
  id uuid primary key default gen_random_uuid(),
  message text not null default 'URGENT: School Alert',
  is_active boolean not null default true,
  triggered_by uuid references profiles(id),
  triggered_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

-- Notifications are never inserted directly by clients — only by the
-- SECURITY DEFINER trigger functions below, one per event worth surfacing
-- in the bell (new report, new message, reply/passcode requests, reply
-- access decisions, report status changes, announcements, urgent warnings).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_idx on notifications(recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on notifications(recipient_id) where not read;

-- Real, admin-managed sections: created (optionally) before any student is
-- assigned to one; renaming a section updates every student in it via the
-- FK, no bulk text update needed.
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_section_id_fkey') then
    alter table profiles
      add constraint profiles_section_id_fkey foreign key (section_id) references sections(id) on delete set null;
  end if;
end $$;

create index if not exists reports_student_id_idx on reports(student_id);
create index if not exists reports_status_idx on reports(status);
create index if not exists direct_messages_student_id_idx on direct_messages(student_id);
create index if not exists urgent_warnings_active_idx on urgent_warnings(is_active) where is_active;

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
-- set_reply_access() — the only way can_reply_to_admin ever changes.
-- Runs as the function owner (SECURITY DEFINER) so it can write a column
-- that is deliberately NOT in the students' update grant below; the
-- is_admin() check here is what keeps students from granting it to
-- themselves.
-- ---------------------------------------------------------------------

create or replace function public.set_reply_access(target_student_id uuid, allowed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an Admin can change reply access.';
  end if;

  update profiles
    set can_reply_to_admin = allowed,
        reply_requested_at = null
    where id = target_student_id;
end;
$$;

grant execute on function public.set_reply_access(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Notifications — fan-out helpers + one trigger per source event.
-- All SECURITY DEFINER so they can write notifications regardless of the
-- calling role's own grants (same pattern as set_reply_access above).
-- ---------------------------------------------------------------------

create or replace function public.notify_admins(p_type text, p_title text, p_body text, p_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link from profiles where role = 'admin';
end;
$$;

create or replace function public.notify_students(p_type text, p_title text, p_body text, p_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link from profiles where role = 'student';
end;
$$;

-- New report -> notify every admin.
create or replace function public.trg_notify_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_name text;
begin
  select full_name into student_name from profiles where id = new.student_id;
  perform notify_admins(
    'new_report',
    'New report submitted',
    coalesce(student_name, 'A student') || ' submitted a ' || new.type || ' report.',
    '/admin/reports'
  );
  return new;
end;
$$;

drop trigger if exists on_report_insert_notify on reports;
create trigger on_report_insert_notify after insert on reports
for each row execute function public.trg_notify_new_report();

-- Report status change -> notify the student who filed it.
create or replace function public.trg_notify_report_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (recipient_id, type, title, body, link)
    values (
      new.student_id,
      'report_status',
      'Report status updated',
      'Your ' || new.type || ' report is now "' || new.status || '".',
      '/my-reports'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_update_notify on reports;
create trigger on_report_update_notify after update on reports
for each row execute function public.trg_notify_report_status();

-- New direct message -> notify whichever side didn't send it.
create or replace function public.trg_notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  if new.sender_id = new.student_id then
    select full_name into sender_name from profiles where id = new.sender_id;
    perform notify_admins(
      'new_message',
      'New message',
      coalesce(sender_name, 'A student') || ' sent you a message.',
      '/admin/messages'
    );
  else
    insert into notifications (recipient_id, type, title, body, link)
    values (new.student_id, 'new_message', 'New message from Admin', left(new.message, 120), '/inbox');
  end if;
  return new;
end;
$$;

drop trigger if exists on_message_insert_notify on direct_messages;
create trigger on_message_insert_notify after insert on direct_messages
for each row execute function public.trg_notify_new_message();

-- Reply-access requests, passcode-reset requests, and reply-access decisions.
create or replace function public.trg_notify_profile_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reply_requested_at is not null and old.reply_requested_at is null then
    perform notify_admins(
      'reply_request',
      'Reply access requested',
      coalesce(new.full_name, 'A student') || ' is asking for permission to reply.',
      '/admin/messages'
    );
  end if;

  if new.passcode_reset_requested_at is not null and old.passcode_reset_requested_at is null then
    perform notify_admins(
      'passcode_request',
      'Passcode reset requested',
      coalesce(new.full_name, 'A student') || ' forgot their My Reports passcode.',
      '/admin/passcode-requests'
    );
  end if;

  if new.can_reply_to_admin is distinct from old.can_reply_to_admin then
    insert into notifications (recipient_id, type, title, body, link)
    values (
      new.id,
      'reply_access',
      case when new.can_reply_to_admin then 'Reply access granted' else 'Reply access turned off' end,
      case
        when new.can_reply_to_admin then 'You can now reply to Admin messages in your Inbox.'
        else 'You can no longer reply to Admin messages.'
      end,
      '/inbox'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_update_notify on profiles;
create trigger on_profile_update_notify after update on profiles
for each row execute function public.trg_notify_profile_events();

-- New announcement -> notify every student.
create or replace function public.trg_notify_new_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notify_students(
    'announcement',
    'New announcement: ' || new.title,
    left(new.message, 120),
    '/announcements'
  );
  return new;
end;
$$;

drop trigger if exists on_announcement_insert_notify on announcements;
create trigger on_announcement_insert_notify after insert on announcements
for each row execute function public.trg_notify_new_announcement();

-- Urgent warning triggered / cleared -> notify every student.
create or replace function public.trg_notify_urgent_warning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.is_active then
    perform notify_students('urgent_warning', 'Urgent Warning', new.message, '/dashboard');
  elsif tg_op = 'UPDATE' and new.is_active is distinct from old.is_active then
    if new.is_active then
      perform notify_students('urgent_warning', 'Urgent Warning', new.message, '/dashboard');
    else
      perform notify_students('urgent_warning_cleared', 'Warning lifted', 'The urgent warning has been cleared.', '/dashboard');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_urgent_warning_notify on urgent_warnings;
create trigger on_urgent_warning_notify after insert or update on urgent_warnings
for each row execute function public.trg_notify_urgent_warning();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table reports enable row level security;
alter table announcements enable row level security;
alter table direct_messages enable row level security;
alter table urgent_warnings enable row level security;
alter table audit_log enable row level security;
alter table sections enable row level security;
alter table notifications enable row level security;

-- profiles: students see/manage only their own row, admins see/manage all.
-- Row creation happens exclusively through the create-student Edge Function
-- (service role), so there is no INSERT policy for regular clients.
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- Students can't select admin rows directly (profiles RLS above is
-- own-row-only for them), but the Inbox needs to show the real name/photo
-- of whichever Admin sent a message. This view runs with its owner's
-- privileges (the default for a plain view), so it can read every admin
-- row regardless of the caller's RLS — while only ever exposing the two
-- display columns, never contact info or anything else on the row.
create or replace view admin_directory as
  select id, full_name, avatar_url from profiles where role = 'admin';

grant select on admin_directory to authenticated;

-- Students may only ever change their own contact number / password flag /
-- name — never their own role or student_number. Admins get full column
-- access so they can manage accounts.
revoke update on profiles from authenticated;
grant update (contact_number, contact_number_verified, contact_email, avatar_url, must_change_password, full_name, reports_passcode_hash, reply_requested_at, passcode_reset_requested_at) on profiles to authenticated;

drop policy if exists "profiles_delete_admin" on profiles;
create policy "profiles_delete_admin" on profiles
  for delete using (is_admin());

-- reports: students insert/read their own; admins read/update all.
drop policy if exists "reports_insert_own" on reports;
create policy "reports_insert_own" on reports
  for insert with check (student_id = auth.uid());

drop policy if exists "reports_select_own_or_admin" on reports;
create policy "reports_select_own_or_admin" on reports
  for select using (student_id = auth.uid() or is_admin());

drop policy if exists "reports_update_admin" on reports;
create policy "reports_update_admin" on reports
  for update using (is_admin()) with check (is_admin());

-- announcements: everyone signed in can read; only admins write.
drop policy if exists "announcements_select_all" on announcements;
create policy "announcements_select_all" on announcements
  for select using (auth.uid() is not null);

drop policy if exists "announcements_write_admin" on announcements;
create policy "announcements_write_admin" on announcements
  for all using (is_admin()) with check (is_admin());

-- direct_messages: student reads/marks-read own; admin reads/writes all.
drop policy if exists "dm_select_own_or_admin" on direct_messages;
create policy "dm_select_own_or_admin" on direct_messages
  for select using (student_id = auth.uid() or is_admin());

drop policy if exists "dm_insert_admin" on direct_messages;
create policy "dm_insert_admin" on direct_messages
  for insert with check (is_admin());

-- A student may reply in their own thread only once an Admin has granted
-- can_reply_to_admin (via set_reply_access) — prevents unsolicited/abusive
-- messages until an Admin opts a specific student in.
drop policy if exists "dm_insert_student_if_allowed" on direct_messages;
create policy "dm_insert_student_if_allowed" on direct_messages
  for insert with check (
    student_id = auth.uid()
    and sender_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and can_reply_to_admin = true)
  );

drop policy if exists "dm_update_own_or_admin" on direct_messages;
create policy "dm_update_own_or_admin" on direct_messages
  for update using (student_id = auth.uid() or is_admin())
  with check (student_id = auth.uid() or is_admin());

revoke update on direct_messages from authenticated;
grant update (read) on direct_messages to authenticated;

-- urgent_warnings: everyone signed in can read; only admins write.
drop policy if exists "warnings_select_all" on urgent_warnings;
create policy "warnings_select_all" on urgent_warnings
  for select using (auth.uid() is not null);

drop policy if exists "warnings_write_admin" on urgent_warnings;
create policy "warnings_write_admin" on urgent_warnings
  for all using (is_admin()) with check (is_admin());

-- audit_log: admin only, both directions.
drop policy if exists "audit_admin_only" on audit_log;
create policy "audit_admin_only" on audit_log
  for all using (is_admin()) with check (is_admin());

-- notifications: each user reads/marks-read only their own; inserts happen
-- exclusively through the SECURITY DEFINER trigger functions above.
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

revoke update on notifications from authenticated;
grant update (read) on notifications to authenticated;

-- sections: everyone signed in can read (for the dropdown); only admins write.
drop policy if exists "sections_select_all" on sections;
create policy "sections_select_all" on sections
  for select using (auth.uid() is not null);

drop policy if exists "sections_write_admin" on sections;
create policy "sections_write_admin" on sections
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

drop policy if exists "report_evidence_student_insert" on storage.objects;
create policy "report_evidence_student_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "report_evidence_admin_select" on storage.objects;
create policy "report_evidence_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'report-evidence' and is_admin());

drop policy if exists "report_evidence_owner_select" on storage.objects;
create policy "report_evidence_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Storage: public bucket for profile photos. Anyone signed in can view
-- (they're just avatars); each user may only write under their own
-- user-id folder (e.g. `${auth.uid()}/avatar.jpg`).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select" on storage.objects
  for select using (bucket_id = 'avatars');

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
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Seed the admin PROFILE row.
-- 1. Create the admin user in Supabase Dashboard > Authentication > Users
--    (or `supabase auth admin create-user`) — note the generated UUID.
-- 2. Run the statement below with that UUID to promote it to admin.
-- ---------------------------------------------------------------------
-- insert into profiles (id, role, full_name, must_change_password)
-- values ('00000000-0000-0000-0000-000000000000', 'admin', 'School Admin', false)
-- on conflict (id) do update set role = 'admin';
