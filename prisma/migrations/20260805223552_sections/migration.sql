-- Real, admin-managed sections: a proper table + FK so a section can be
-- created before any student is assigned to it, and renaming it updates
-- every student in it automatically (no bulk text update needed).

create table sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles add column section_id uuid references sections(id) on delete set null;
alter table profiles drop column section;

alter table sections enable row level security;

create policy "sections_select_all" on sections
  for select using (auth.uid() is not null);

create policy "sections_write_admin" on sections
  for all using (is_admin()) with check (is_admin());
