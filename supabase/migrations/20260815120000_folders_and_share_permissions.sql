-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — folders + share permissions
-- Run in the Supabase SQL Editor or via `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────

-- ── folders ──────────────────────────────────────────────────
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id  uuid references public.folders (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists folders_user_id_idx on public.folders (user_id);
create index if not exists folders_parent_id_idx on public.folders (parent_id);

alter table public.folders enable row level security;

-- folders: owners have full access to their own rows only.
drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own" on public.folders
  for select using (user_id = auth.uid());

drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own" on public.folders
  for insert with check (user_id = auth.uid());

drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own" on public.folders
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own" on public.folders
  for delete using (user_id = auth.uid());

-- ── documents.folder_id ──────────────────────────────────────
alter table public.documents
  add column if not exists folder_id uuid references public.folders (id) on delete set null;

create index if not exists documents_folder_id_idx on public.documents (folder_id);

-- Re-create the write policies so a document can only be attached to a folder
-- the caller owns (or to no folder at all).
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (
    owner_id = auth.uid()
    and (
      folder_id is null
      or exists (
        select 1 from public.folders f
        where f.id = folder_id and f.user_id = auth.uid()
      )
    )
  );

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (
      folder_id is null
      or exists (
        select 1 from public.folders f
        where f.id = folder_id and f.user_id = auth.uid()
      )
    )
  );

-- ── shares.permission ────────────────────────────────────────
alter table public.shares
  add column if not exists permission text not null default 'read'
  check (permission in ('read', 'write'));
