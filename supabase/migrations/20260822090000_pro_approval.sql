-- Separate professionals from clients, and gate pro accounts behind admin approval.
--
--   account_type : 'private' (client) | 'pro'
--   pro_status   : null | 'pending' | 'approved' | 'rejected'
--   is_admin     : true only for the super-admin(s) who approve pro requests
--
-- is_professional stays the effective "approved & active pro" gate used across
-- the app; it becomes true ONLY when an admin approves a request.

alter table public.profiles
  add column if not exists account_type text not null default 'private',
  add column if not exists pro_status text,
  add column if not exists is_admin boolean not null default false;

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles
  add constraint profiles_account_type_check check (account_type in ('private', 'pro'));

alter table public.profiles drop constraint if exists profiles_pro_status_check;
alter table public.profiles
  add constraint profiles_pro_status_check
  check (pro_status is null or pro_status in ('pending', 'approved', 'rejected'));

-- Existing self-toggled pros are grandfathered in as approved.
update public.profiles
  set account_type = 'pro', pro_status = 'approved'
  where is_professional = true;

-- SECURITY DEFINER so the admin RLS policies below can check admin status
-- without recursively evaluating profiles' own row-level policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Admins can read and update every profile (to approve/reject pro requests).
-- Additive to the existing owner-only policies.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Bootstrap the super-admin. EDIT this email to the account that should approve
-- pro requests, then it's set once. Safe to re-run.
update public.profiles set is_admin = true
  where id = (select id from auth.users where lower(email) = lower('oukmed30066@gmail.com'));
