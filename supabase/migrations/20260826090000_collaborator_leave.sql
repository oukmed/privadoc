-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — let an invited collaborator leave (remove) their own
-- collaboration. Safe to re-run.
--
-- Until now only the owner could delete a `collaborators` row
-- (collaborators_delete_own: owner_id = auth.uid()). The invitee had no
-- way to opt out, so a "Quitter" click was silently blocked by RLS.
-- This adds a permissive DELETE policy for the invitee; the two policies
-- are OR-ed, so the owner keeps their delete right. collaborator_access
-- rows cascade on delete via the existing FK.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "collaborators_delete_self" on public.collaborators;
create policy "collaborators_delete_self" on public.collaborators
  for delete using (user_id = auth.uid());
