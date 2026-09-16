-- Study Hub database schema
create extension if not exists "pgcrypto";

drop table if exists lessons cascade;
drop table if exists items cascade;
drop table if exists folders cascade;

create table folders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  color       text not null default 'blue',
  icon        text not null default '📁',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  folder_id   uuid not null references folders(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 150),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table lessons (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  item_id     uuid not null unique references items(id) on delete cascade,
  title       text not null default '',
  content     text not null default '',
  content_text text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index folders_owner_idx on folders (owner_id, position);
create index items_folder_idx on items (folder_id, position);
create index items_owner_idx on items (owner_id);
create index lessons_owner_idx on lessons (owner_id);
create index lessons_search_idx on lessons using gin (to_tsvector('simple', coalesce(content_text, '')));

alter table folders enable row level security;
alter table items   enable row level security;
alter table lessons enable row level security;

create policy "folders_select_own" on folders for select using (auth.uid() = owner_id);
create policy "folders_insert_own" on folders for insert with check (auth.uid() = owner_id);
create policy "folders_update_own" on folders for update using (auth.uid() = owner_id);
create policy "folders_delete_own" on folders for delete using (auth.uid() = owner_id);

create policy "items_select_own" on items for select using (auth.uid() = owner_id);
create policy "items_insert_own" on items for insert with check (auth.uid() = owner_id);
create policy "items_update_own" on items for update using (auth.uid() = owner_id);
create policy "items_delete_own" on items for delete using (auth.uid() = owner_id);

create policy "lessons_select_own" on lessons for select using (auth.uid() = owner_id);
create policy "lessons_insert_own" on lessons for insert with check (auth.uid() = owner_id);
create policy "lessons_update_own" on lessons for update using (auth.uid() = owner_id);
create policy "lessons_delete_own" on lessons for delete using (auth.uid() = owner_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger folders_set_updated_at before update on folders
  for each row execute procedure set_updated_at();
create trigger items_set_updated_at before update on items
  for each row execute procedure set_updated_at();
create trigger lessons_set_updated_at before update on lessons
  for each row execute procedure set_updated_at();
