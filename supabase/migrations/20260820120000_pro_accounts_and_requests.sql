-- ─────────────────────────────────────────────────────────────
-- PrivaDoc — pro accounts + "demande de pièces" (document requests)
-- Run in the Supabase SQL Editor or via `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE.
--
-- Adds:
--   • profiles          — per-user account settings (private vs professional; Stripe billing later)
--   • document_requests — a named request from a pro to a client
--   • request_items     — the expected pieces of a request (one uploaded document each)
--   • notifications     — in-app notifications (replace email); inserted server-side only
-- Extends collaborators.role and the signup trigger. Complements — does NOT
-- replace — the existing collaborators / collaborator_access model.
-- ─────────────────────────────────────────────────────────────

-- ── A. profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  is_professional     boolean not null default false,
  plan                text not null default 'free',
  stripe_customer_id  text,
  subscription_status text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── B. document_requests ─────────────────────────────────────
create table if not exists public.document_requests (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_email    text not null,
  client_id       uuid references auth.users (id) on delete set null,
  title           text not null,
  status          text not null default 'open' check (status in ('open','completed','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists document_requests_professional_id_idx on public.document_requests (professional_id);
create index if not exists document_requests_client_id_idx on public.document_requests (client_id);
create index if not exists document_requests_client_email_idx on public.document_requests (lower(client_email));

alter table public.document_requests enable row level security;

drop policy if exists "document_requests_select" on public.document_requests;
create policy "document_requests_select" on public.document_requests
  for select using (professional_id = auth.uid() or client_id = auth.uid());

drop policy if exists "document_requests_insert" on public.document_requests;
create policy "document_requests_insert" on public.document_requests
  for insert with check (professional_id = auth.uid());

drop policy if exists "document_requests_update" on public.document_requests;
create policy "document_requests_update" on public.document_requests
  for update using (professional_id = auth.uid()) with check (professional_id = auth.uid());

drop policy if exists "document_requests_delete" on public.document_requests;
create policy "document_requests_delete" on public.document_requests
  for delete using (professional_id = auth.uid());

-- ── C. request_items ─────────────────────────────────────────
create table if not exists public.request_items (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.document_requests (id) on delete cascade,
  label       text not null,
  due_date    date,
  status      text not null default 'pending' check (status in ('pending','submitted','validated','rejected')),
  comment     text,
  document_id uuid references public.documents (id) on delete set null,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists request_items_request_id_idx on public.request_items (request_id);

alter table public.request_items enable row level security;

-- Access flows through the parent request. Column-level rules (client only
-- attaches/submits, pro only validates/rejects) are enforced in server actions.
drop policy if exists "request_items_select" on public.request_items;
create policy "request_items_select" on public.request_items
  for select using (
    exists (
      select 1 from public.document_requests r
      where r.id = request_id
        and (r.professional_id = auth.uid() or r.client_id = auth.uid())
    )
  );

drop policy if exists "request_items_insert" on public.request_items;
create policy "request_items_insert" on public.request_items
  for insert with check (
    exists (
      select 1 from public.document_requests r
      where r.id = request_id and r.professional_id = auth.uid()
    )
  );

drop policy if exists "request_items_update" on public.request_items;
create policy "request_items_update" on public.request_items
  for update using (
    exists (
      select 1 from public.document_requests r
      where r.id = request_id
        and (r.professional_id = auth.uid() or r.client_id = auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.document_requests r
      where r.id = request_id
        and (r.professional_id = auth.uid() or r.client_id = auth.uid())
    )
  );

drop policy if exists "request_items_delete" on public.request_items;
create policy "request_items_delete" on public.request_items
  for delete using (
    exists (
      select 1 from public.document_requests r
      where r.id = request_id and r.professional_id = auth.uid()
    )
  );

-- ── D. notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  request_id uuid references public.document_requests (id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_id_read_idx on public.notifications (user_id, read);

alter table public.notifications enable row level security;

-- NO insert policy: rows are inserted server-side via the service-role client
-- (see src/lib/notify.ts). A normal session must not be able to write to
-- another user's inbox.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

-- ── E. Pro read access to submitted pieces ───────────────────
-- Additive permissive SELECT policies (Postgres ORs them with existing owner
-- policies). A pro reads only documents attached to their own requests.
drop policy if exists "documents_select_via_request" on public.documents;
create policy "documents_select_via_request" on public.documents
  for select using (
    exists (
      select 1
      from public.request_items ri
      join public.document_requests r on r.id = ri.request_id
      where ri.document_id = documents.id
        and r.professional_id = auth.uid()
    )
  );

drop policy if exists "documents_storage_select_via_request" on storage.objects;
create policy "documents_storage_select_via_request" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      join public.request_items ri on ri.document_id = d.id
      join public.document_requests r on r.id = ri.request_id
      where d.storage_path = storage.objects.name
        and r.professional_id = auth.uid()
    )
  );

-- ── F. Extend collaborators.role with two new roles ──────────
-- Recreate the inline column CHECK (default name collaborators_role_check).
alter table public.collaborators drop constraint if exists collaborators_role_check;
alter table public.collaborators add constraint collaborators_role_check
  check (role in ('avocat','comptable','banque','notaire','administration','autre','consulat','traducteur'));

-- ── G. Extend the signup trigger ─────────────────────────────
-- Keeps the existing collaborator linking; also seeds a profile row and links
-- any pending document_requests addressed to the new user's email.
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

  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  update public.document_requests
  set client_id = new.id
  where lower(client_email) = lower(new.email) and client_id is null;

  return new;
end
$$;

-- Existing trigger on_auth_user_created_link_collaborator stays attached.

-- ── updated_at triggers for the new tables ───────────────────
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists document_requests_set_updated_at on public.document_requests;
create trigger document_requests_set_updated_at
  before update on public.document_requests
  for each row execute function public.set_updated_at();

drop trigger if exists request_items_set_updated_at on public.request_items;
create trigger request_items_set_updated_at
  before update on public.request_items
  for each row execute function public.set_updated_at();
