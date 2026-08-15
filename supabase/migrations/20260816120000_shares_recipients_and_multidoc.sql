-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — multi-document shares + email recipients
-- Run in the Supabase SQL Editor or via `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────

-- ── shares: recipient metadata + optional document_id ────────
alter table public.shares
  add column if not exists recipient_email text;

alter table public.shares
  add column if not exists recipient_role text;

-- Multi-document shares hang their documents off share_documents, so the legacy
-- single-document FK column becomes optional.
alter table public.shares
  alter column document_id drop not null;

-- ── Rebase shares RLS on ownership by creator ────────────────
-- document_id may now be null, so policies key off created_by (never null)
-- rather than the underlying document's owner.
drop policy if exists "shares_select_own" on public.shares;
create policy "shares_select_own" on public.shares
  for select using (created_by = auth.uid());

drop policy if exists "shares_insert_own" on public.shares;
create policy "shares_insert_own" on public.shares
  for insert with check (
    created_by = auth.uid()
    and (
      document_id is null
      or exists (
        select 1 from public.documents d
        where d.id = document_id and d.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "shares_delete_own" on public.shares;
create policy "shares_delete_own" on public.shares
  for delete using (created_by = auth.uid());

-- ── share_documents (junction: one share → many documents) ───
create table if not exists public.share_documents (
  id          uuid primary key default gen_random_uuid(),
  share_id    uuid not null references public.shares (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (share_id, document_id)
);

create index if not exists share_documents_share_id_idx on public.share_documents (share_id);
create index if not exists share_documents_document_id_idx on public.share_documents (document_id);

alter table public.share_documents enable row level security;

-- A junction row is visible/removable only by the owner of the parent share.
drop policy if exists "share_documents_select_own" on public.share_documents;
create policy "share_documents_select_own" on public.share_documents
  for select using (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.created_by = auth.uid()
    )
  );

drop policy if exists "share_documents_delete_own" on public.share_documents;
create policy "share_documents_delete_own" on public.share_documents
  for delete using (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.created_by = auth.uid()
    )
  );

-- Insert only into a share you own, and only for a document you own.
drop policy if exists "share_documents_insert_own" on public.share_documents;
create policy "share_documents_insert_own" on public.share_documents
  for insert with check (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.created_by = auth.uid()
    )
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );
