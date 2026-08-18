-- Enforce column/role-level authorization on request_items updates AT THE DB.
--
-- The request_items UPDATE RLS policy allows both the pro and the client to
-- update rows of their request, but can't restrict WHICH columns each may touch.
-- Without this trigger a client could (via a direct PostgREST call) self-validate
-- their own pieces, rewrite the pro's comment, or point document_id at a document
-- they don't own. This trigger enforces the split the server actions assume:
--   • pro (request owner): may change only status + comment
--   • client:              may only attach a document and mark it 'submitted'
-- The service-role client (auth.uid() null) bypasses — it's trusted server code.

create or replace function public.enforce_request_item_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_pro boolean;
  is_client boolean;
begin
  if auth.uid() is null then
    return new; -- trusted service-role / server context
  end if;

  select (r.professional_id = auth.uid()), (r.client_id = auth.uid())
    into is_pro, is_client
  from public.document_requests r
  where r.id = old.request_id;

  -- Pro: only status + comment may change.
  if coalesce(is_pro, false) then
    if new.label is distinct from old.label
       or new.due_date is distinct from old.due_date
       or new.position is distinct from old.position
       or new.document_id is distinct from old.document_id
       or new.request_id is distinct from old.request_id then
      raise exception 'request_items: pro may only update status and comment';
    end if;
    return new;
  end if;

  -- Client: only attach a document and mark it submitted.
  if coalesce(is_client, false) then
    if new.label is distinct from old.label
       or new.due_date is distinct from old.due_date
       or new.position is distinct from old.position
       or new.comment is distinct from old.comment
       or new.request_id is distinct from old.request_id then
      raise exception 'request_items: client may only submit a document';
    end if;
    if new.status not in ('pending', 'submitted') then
      raise exception 'request_items: client may only set status to submitted';
    end if;
    return new;
  end if;

  raise exception 'request_items: not authorized';
end
$$;

drop trigger if exists request_items_enforce_update on public.request_items;
create trigger request_items_enforce_update
  before update on public.request_items
  for each row execute function public.enforce_request_item_update();
