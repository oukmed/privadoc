-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — documents + sharing schema
-- Run in the Supabase SQL Editor or via `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────

-- ── Helper: keep updated_at fresh ────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── documents ────────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  -- Path within the private `documents` storage bucket, e.g. "{owner_id}/{uuid}.pdf"
  storage_path text not null unique,
  mime_type    text,
  size_bytes   bigint check (size_bytes is null or size_bytes >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists documents_owner_id_idx on public.documents (owner_id);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ── shares (public link tokens) ──────────────────────────────
create table if not exists public.shares (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  -- 32-char random token; enough entropy for an unguessable public link.
  token       text not null unique default replace(gen_random_uuid()::text, '-', ''),
  expires_at  timestamptz,               -- null = never expires
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists shares_document_id_idx on public.shares (document_id);
create index if not exists shares_token_idx on public.shares (token);

-- ── Row Level Security ───────────────────────────────────────
alter table public.documents enable row level security;
alter table public.shares    enable row level security;

-- documents: owners have full access to their own rows only.
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (owner_id = auth.uid());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (owner_id = auth.uid());

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (owner_id = auth.uid());

-- shares: only the owner of the underlying document can manage share links.
-- NOTE: public (anon) access to a shared document is handled server-side with the
-- service_role key (validating token + expiry), NOT via an anon RLS policy.
drop policy if exists "shares_select_own" on public.shares;
create policy "shares_select_own" on public.shares
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

drop policy if exists "shares_insert_own" on public.shares;
create policy "shares_insert_own" on public.shares
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

drop policy if exists "shares_delete_own" on public.shares;
create policy "shares_delete_own" on public.shares
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

-- ── Storage: private `documents` bucket ──────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Files are stored under "{owner_id}/...". Owners manage only their own folder.
drop policy if exists "documents_storage_select_own" on storage.objects;
create policy "documents_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_storage_insert_own" on storage.objects;
create policy "documents_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_storage_update_own" on storage.objects;
create policy "documents_storage_update_own" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_storage_delete_own" on storage.objects;
create policy "documents_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
