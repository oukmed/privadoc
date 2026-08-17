-- Professional identity: a display name (person or firm) and a profession, so
-- clients see WHO is asking for documents instead of a raw email address.

-- Editable identity lives on the pro's own profile.
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists profession text;

-- Snapshot onto each request at creation time. The client cannot read the pro's
-- profile row (profiles RLS is owner-only), so the identity is denormalized here.
alter table public.document_requests
  add column if not exists professional_name text,
  add column if not exists professional_profession text;
