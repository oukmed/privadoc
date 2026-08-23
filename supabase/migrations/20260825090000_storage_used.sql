-- Total bytes stored by the current user (their own documents only). Powers the
-- per-account storage quota (enforced in server actions) and the /account gauge.
create or replace function public.storage_used()
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from public.documents
  where owner_id = auth.uid()
$$;
