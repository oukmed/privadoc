-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — recursive folder access for collaborators
-- Sharing a folder now grants read access to its whole subtree (nested
-- subfolders + their files), not just the folder's direct files.
-- Read-only; write-back (deposit) stays direct-folder only. Idempotent.
-- ─────────────────────────────────────────────────────────────

-- True when `target` (or any of its ancestors) is a non-expired folder grant
-- for the current user. SECURITY DEFINER so it can walk the full parent chain
-- past folders the collaborator can't directly SELECT. `auth.uid()` still
-- reflects the calling user inside a definer function.
create or replace function public.collaborator_folder_granted(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive chain as (
    select id, parent_id from public.folders where id = target
    union all
    select f.id, f.parent_id
    from public.folders f
    join chain ch on f.id = ch.parent_id
  )
  select exists (
    select 1
    from chain
    join public.collaborator_access ca on ca.folder_id = chain.id
    join public.collaborators c on c.id = ca.collaborator_id
    where c.user_id = auth.uid()
      and (ca.expires_at is null or ca.expires_at > now())
  );
$$;

-- documents: direct document grant, or the document sits anywhere under a granted folder.
drop policy if exists "documents_select_granted" on public.documents;
create policy "documents_select_granted" on public.documents
  for select using (
    exists (
      select 1
      from public.collaborator_access ca
      join public.collaborators c on c.id = ca.collaborator_id
      where c.user_id = auth.uid()
        and (ca.expires_at is null or ca.expires_at > now())
        and ca.document_id = documents.id
    )
    or (documents.folder_id is not null and public.collaborator_folder_granted(documents.folder_id))
  );

-- folders: the granted folder itself and every descendant folder become visible.
drop policy if exists "folders_select_granted" on public.folders;
create policy "folders_select_granted" on public.folders
  for select using (
    public.collaborator_folder_granted(folders.id)
  );

-- storage: download the real file for any document the collaborator can read (recursive).
drop policy if exists "documents_storage_select_granted" on storage.objects;
create policy "documents_storage_select_granted" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      where d.storage_path = storage.objects.name
        and (
          exists (
            select 1
            from public.collaborator_access ca
            join public.collaborators c on c.id = ca.collaborator_id
            where c.user_id = auth.uid()
              and (ca.expires_at is null or ca.expires_at > now())
              and ca.document_id = d.id
          )
          or (d.folder_id is not null and public.collaborator_folder_granted(d.folder_id))
        )
    )
  );
