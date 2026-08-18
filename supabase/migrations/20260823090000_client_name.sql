-- Store the client's name on each request so the pro can tell clients apart by
-- name, not just by email address.
alter table public.document_requests
  add column if not exists client_name text;
