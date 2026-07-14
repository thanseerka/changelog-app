create extension if not exists "pgcrypto";

create table public.repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner text not null,
  name text not null,
  full_name text not null,
  last_synced_sha text,
  created_at timestamptz not null default now(),

  constraint repos_user_full_name_unique
    unique (user_id, full_name)
);

create table public.changelogs (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos(id) on delete cascade,
  version_label text not null,
  content_md text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index repos_user_id_idx
  on public.repos(user_id);

create index changelogs_repo_id_idx
  on public.changelogs(repo_id);

alter table public.repos enable row level security;

alter table public.changelogs enable row level security;

create policy "Users can view their own repositories"
on public.repos
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users can create their own repositories"
on public.repos
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Users can update their own repositories"
on public.repos
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users can delete their own repositories"
on public.repos
for delete
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users can view changelogs for their repositories"
on public.changelogs
for select
to authenticated
using (
  exists (
    select 1
    from public.repos
    where repos.id = changelogs.repo_id
      and repos.user_id = auth.uid()
  )
);

create policy "Users can create changelogs for their repositories"
on public.changelogs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.repos
    where repos.id = changelogs.repo_id
      and repos.user_id = auth.uid()
  )
);

create policy "Users can update changelogs for their repositories"
on public.changelogs
for update
to authenticated
using (
  exists (
    select 1
    from public.repos
    where repos.id = changelogs.repo_id
      and repos.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.repos
    where repos.id = changelogs.repo_id
      and repos.user_id = auth.uid()
  )
);

create policy "Users can delete changelogs for their repositories"
on public.changelogs
for delete
to authenticated
using (
  exists (
    select 1
    from public.repos
    where repos.id = changelogs.repo_id
      and repos.user_id = auth.uid()
  )
);