-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — collaborators (permanent, read-only external access)
-- Run in the Supabase SQL Editor or via `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE.
--
-- Distinct from `shares` (anonymous time-limited public links): a collaborator is
-- a named external person (avocat/comptable/…) the owner invites to specific
-- documents/folders with PERMANENT, read-only access once they sign up.
-- v1 is READ-ONLY: collaborators get SELECT only, never insert/update/delete.
-- ─────────────────────────────────────────────────────────────

-- ── collaborators ────────────────────────────────────────────
create table if not exists public.collaborators (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('avocat','comptable','banque','notaire','administration','autre')),
  -- Filled in when the invited email signs up (see link trigger below); null until then.
  user_id     uuid references auth.users (id) on delete set null,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (owner_id, email)
);

create index if not exists collaborators_owner_id_idx on public.collaborators (owner_id);
create index if not exists collaborators_user_id_idx on public.collaborators (user_id);
create index if not exists collaborators_email_idx on public.collaborators (email);

-- ── collaborator_access (grants to documents and/or folders) ──
create table if not exists public.collaborator_access (
  id              uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators (id) on delete cascade,
  document_id     uuid references public.documents (id) on delete cascade,
  folder_id       uuid references public.folders (id) on delete cascade,
  expires_at      timestamptz,               -- null = permanent
  created_at      timestamptz not null default now(),
  check (document_id is not null or folder_id is not null)
);

create index if not exists collaborator_access_collaborator_id_idx on public.collaborator_access (collaborator_id);
create index if not exists collaborator_access_document_id_idx on public.collaborator_access (document_id);
create index if not exists collaborator_access_folder_id_idx on public.collaborator_access (folder_id);

-- ── Link invited email → account on signup ───────────────────
create or replace function public.link_collaborator_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collaborators
  set user_id = new.id,
      accepted_at = coalesce(accepted_at, now())
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end
$$;

drop trigger if exists on_auth_user_created_link_collaborator on auth.users;
create trigger on_auth_user_created_link_collaborator
  after insert on auth.users
  for each row execute function public.link_collaborator_on_signup();

-- ── Row Level Security ───────────────────────────────────────
alter table public.collaborators       enable row level security;
alter table public.collaborator_access enable row level security;

-- collaborators: owner has full CRUD over their own invitees.
drop policy if exists "collaborators_select_own" on public.collaborators;
create policy "collaborators_select_own" on public.collaborators
  for select using (owner_id = auth.uid());

drop policy if exists "collaborators_insert_own" on public.collaborators;
create policy "collaborators_insert_own" on public.collaborators
  for insert with check (owner_id = auth.uid());

drop policy if exists "collaborators_update_own" on public.collaborators;
create policy "collaborators_update_own" on public.collaborators
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "collaborators_delete_own" on public.collaborators;
create policy "collaborators_delete_own" on public.collaborators
  for delete using (owner_id = auth.uid());

-- collaborators: an invitee can see their own row (additive permissive SELECT).
drop policy if exists "collaborators_select_self" on public.collaborators;
create policy "collaborators_select_self" on public.collaborators
  for select using (user_id = auth.uid());

-- collaborator_access: owner manages rows whose parent collaborator they own.
drop policy if exists "collaborator_access_select_own" on public.collaborator_access;
create policy "collaborator_access_select_own" on public.collaborator_access
  for select using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "collaborator_access_insert_own" on public.collaborator_access;
create policy "collaborator_access_insert_own" on public.collaborator_access
  for insert with check (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "collaborator_access_update_own" on public.collaborator_access;
create policy "collaborator_access_update_own" on public.collaborator_access
  for update using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "collaborator_access_delete_own" on public.collaborator_access;
create policy "collaborator_access_delete_own" on public.collaborator_access
  for delete using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.owner_id = auth.uid()
    )
  );

-- collaborator_access: an invitee can see their own grants (additive permissive SELECT).
drop policy if exists "collaborator_access_select_self" on public.collaborator_access;
create policy "collaborator_access_select_self" on public.collaborator_access
  for select using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id and c.user_id = auth.uid()
    )
  );

-- ── Additive read access to the granted data ─────────────────
-- Postgres ORs multiple permissive SELECT policies, so these sit alongside the
-- existing owner policies without touching them. Read-only by design.

drop policy if exists "documents_select_granted" on public.documents;
create policy "documents_select_granted" on public.documents
  for select using (
    exists (
      select 1
      from public.collaborator_access ca
      join public.collaborators c on c.id = ca.collaborator_id
      where c.user_id = auth.uid()
        and (ca.expires_at is null or ca.expires_at > now())
        and (ca.document_id = documents.id or ca.folder_id = documents.folder_id)
    )
  );

drop policy if exists "folders_select_granted" on public.folders;
create policy "folders_select_granted" on public.folders
  for select using (
    exists (
      select 1
      from public.collaborator_access ca
      join public.collaborators c on c.id = ca.collaborator_id
      where c.user_id = auth.uid()
        and (ca.expires_at is null or ca.expires_at > now())
        and ca.folder_id = folders.id
    )
  );

drop policy if exists "documents_storage_select_granted" on storage.objects;
create policy "documents_storage_select_granted" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      join public.collaborator_access ca on (ca.document_id = d.id or ca.folder_id = d.folder_id)
      join public.collaborators c on c.id = ca.collaborator_id
      where d.storage_path = storage.objects.name
        and c.user_id = auth.uid()
        and (ca.expires_at is null or ca.expires_at > now())
    )
  );
