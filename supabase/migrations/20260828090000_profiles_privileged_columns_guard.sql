-- Enforce column/role-level authorization on profiles updates AT THE DB.
--
-- The profiles_update_own RLS policy allows a user to UPDATE their own row, but
-- Postgres RLS can't restrict WHICH columns they may touch. Without this trigger
-- any signed-in user could — via a direct PostgREST call with the public anon key
-- and their own JWT — self-set is_admin/is_professional/plan/subscription_status:
--
--   PATCH /rest/v1/profiles?id=eq.<own-id>   { "is_admin": true }
--
-- That would grant the admin console (/admin) or approved-pro access, bypassing
-- the entire admin-approval workflow that /admin, /pro (and now / — see
-- app/page.tsx) rely on. This trigger makes those columns admin-only at the DB.
--
-- Legitimate write paths, all preserved:
--   • admins        (own session, is_admin()) approve/reject/bill — app/admin/actions.ts
--   • service-role / migrations (auth.uid() null) — trusted server code
--   • a user's own pro REQUEST (requestProAccount) sets account_type='pro' and
--     pro_status='pending' only; it never touches is_professional/is_admin/plan.

create or replace function public.enforce_profile_privileged_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- trusted service-role / server / migration context
  end if;

  if public.is_admin() then
    return new; -- admins may set any flag (pro approval, billing) — enforced by RLS
  end if;

  -- A regular signed-in user updating their own row: these columns are frozen.
  -- Only an admin (or trusted server code) may ever change them.
  if new.is_admin is distinct from old.is_admin
     or new.is_professional is distinct from old.is_professional
     or new.plan is distinct from old.plan
     or new.subscription_status is distinct from old.subscription_status then
    raise exception
      'profiles: is_admin, is_professional, plan and subscription_status can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;

  -- pro_status: a user may only move their own row to 'pending' (request an
  -- account). Approving/rejecting/clearing is admin-only.
  if new.pro_status is distinct from old.pro_status
     and new.pro_status is distinct from 'pending' then
    raise exception
      'profiles: pro_status can only be set to pending by the account owner'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end
$$;

drop trigger if exists profiles_enforce_privileged_update on public.profiles;
create trigger profiles_enforce_privileged_update
  before update on public.profiles
  for each row execute function public.enforce_profile_privileged_update();
