-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — collaborator write-back (v2)
-- Lets an invited collaborator SEND documents back to the owner:
--   • Inbox mode: upload into the owner's space with no folder (folder_id null).
--   • Folder mode: upload into a folder they were granted with permission = 'write'.
-- Uploaded rows are tagged with `uploaded_by`. Read-only access (v1) is unchanged.
-- Idempotent. Run in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────

-- Who uploaded a document: null = the owner; otherwise a collaborator's user id.
alter table public.documents
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null;
create index if not exists documents_uploaded_by_idx on public.documents (uploaded_by);

-- Grants can be read-only (default) or write (collaborator may deposit into the folder).
alter table public.collaborator_access
  add column if not exists permission text not null default 'read'
  check (permission in ('read', 'write'));

-- ── documents: allow a collaborator to INSERT into an owner's space ───────────
-- Additive to documents_insert_own (owners). Collaborators only, and either the
-- owner "inbox" (no folder) or a folder they hold active WRITE access to.
drop policy if exists "documents_insert_collaborator" on public.documents;
create policy "documents_insert_collaborator" on public.documents
  for insert
  with check (
    uploaded_by = auth.uid()
    and owner_id <> auth.uid()
    and exists (
      select 1 from public.collaborators c
      where c.user_id = auth.uid() and c.owner_id = documents.owner_id
    )
    and (
      folder_id is null
      or exists (
        select 1 from public.collaborator_access ca
        join public.collaborators c on c.id = ca.collaborator_id
        where c.user_id = auth.uid()
          and ca.folder_id = documents.folder_id
          and ca.permission = 'write'
          and (ca.expires_at is null or ca.expires_at > now())
      )
    )
  );

-- Collaborators can see the documents they uploaded (to confirm the send).
drop policy if exists "documents_select_own_uploads" on public.documents;
create policy "documents_select_own_uploads" on public.documents
  for select using (uploaded_by = auth.uid());

-- ── storage: allow a collaborator to write into an owner's folder prefix ──────
-- Path convention is "{owner_id}/…"; a collaborator may write under an owner they
-- collaborate with. The documents INSERT policy above enforces the folder rule.
drop policy if exists "documents_storage_insert_collaborator" on storage.objects;
create policy "documents_storage_insert_collaborator" on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] <> auth.uid()::text
    and exists (
      select 1 from public.collaborators c
      where c.user_id = auth.uid()
        and c.owner_id::text = (storage.foldername(name))[1]
    )
  );
