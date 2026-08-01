-- Keelstone Trust — Row Level Security
--
-- This file is the security model. The publishable key shipped in the browser
-- grants nothing on its own; these policies decide what each user can see.
--
-- The CocoBase version had NO row-level security: the admin dashboard listed
-- every investor's deposits straight from the browser and relied on the UI to
-- hide them. That is not reproduced here.
--
-- Conventions applied throughout:
--   * (select auth.uid()) — wrapped in a subquery so it evaluates once per
--     query rather than once per row.
--   * TO authenticated / TO anon — explicit target roles. auth.role() is
--     deprecated and breaks when anonymous sign-ins are enabled.
--   * TO authenticated alone is authentication, not authorization — every
--     policy also carries an ownership or admin predicate.
--   * UPDATE policies always specify both USING and WITH CHECK, otherwise a
--     user can rewrite a row's user_id and hand it to someone else.

alter table public.profiles        enable row level security;
alter table public.plans           enable row level security;
alter table public.deposit_methods enable row level security;
alter table public.deposits        enable row level security;
alter table public.investments     enable row level security;
alter table public.withdrawals     enable row level security;
alter table public.messages        enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Admin check.
--
-- Lives in `private` (not exposed to the Data API) and is SECURITY DEFINER so
-- it can read profiles without recursing into the profiles policies — a policy
-- on profiles that queried profiles directly would loop forever.
-- It checks the *calling* user's identity internally and takes no arguments,
-- so it cannot be pointed at someone else's row.
-- ─────────────────────────────────────────────────────────────
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function by default, which
-- would make this a callable endpoint. Lock it down, then hand it back only to
-- the roles that evaluate policies.
revoke execute on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
create policy "own profile readable"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using ((select private.is_admin()));

-- Note: `role` and `kyc_status` are deliberately NOT protected here at column
-- level — Postgres RLS has no column-level control. A user could otherwise
-- promote themselves to admin. The trigger below blocks exactly that.
create policy "own profile updatable"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Stop a user escalating their own role or self-approving KYC.
-- Admins and server-side code (service_role) bypass this.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;  -- service_role / server-side; no session to guard
  end if;

  if (select private.is_admin()) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'You cannot change your own role.';
  end if;

  if new.kyc_status is distinct from old.kyc_status then
    raise exception 'KYC status is set by the compliance team.';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ─────────────────────────────────────────────────────────────
-- plans — active ones are public (the marketing site lists them)
-- ─────────────────────────────────────────────────────────────
create policy "anyone reads active plans"
  on public.plans for select
  to anon, authenticated
  using (active = true);

create policy "admins read every plan"
  on public.plans for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins write plans"
  on public.plans for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- deposit_methods — wallet addresses are for signed-in investors only
-- ─────────────────────────────────────────────────────────────
create policy "investors read active methods"
  on public.deposit_methods for select
  to authenticated
  using (active = true);

create policy "admins read every method"
  on public.deposit_methods for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins write methods"
  on public.deposit_methods for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- deposits
--
-- There is intentionally NO insert policy for investors. If a user could
-- insert their own deposit row they could credit themselves any amount.
-- Deposits are created by the submit-deposit Edge Function using the secret
-- key, which validates the method and plan first.
-- Likewise no investor UPDATE — only an admin may approve or reject.
-- ─────────────────────────────────────────────────────────────
create policy "own deposits readable"
  on public.deposits for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read all deposits"
  on public.deposits for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins update deposits"
  on public.deposits for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- investments — read-only to investors; created server-side on approval
-- ─────────────────────────────────────────────────────────────
create policy "own investments readable"
  on public.investments for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read all investments"
  on public.investments for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins write investments"
  on public.investments for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- withdrawals — investors may file their own, nothing more
-- ─────────────────────────────────────────────────────────────
create policy "own withdrawals readable"
  on public.withdrawals for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "investors file own withdrawals"
  on public.withdrawals for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    -- a freshly filed request must start pending and unreviewed
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and admin_note is null
  );

create policy "admins read all withdrawals"
  on public.withdrawals for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins update withdrawals"
  on public.withdrawals for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- messages — support inbox, admin only
-- ─────────────────────────────────────────────────────────────
create policy "admins manage messages"
  on public.messages for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Portfolio view.
--
-- security_invoker = on makes the view run under the querying user's policies.
-- Without it the view executes as its owner and would expose every investor's
-- investments to anyone who selected from it.
-- ─────────────────────────────────────────────────────────────
create or replace view public.investments_with_earnings
with (security_invoker = on) as
select
  i.*,
  round(
    i.principal
      * (i.annual_return_pct / 100.0)
      * (extract(epoch from (now() - i.start_date)) / 31536000.0),
    2
  ) as earnings,
  round(
    i.principal + i.principal
      * (i.annual_return_pct / 100.0)
      * (extract(epoch from (now() - i.start_date)) / 31536000.0),
    2
  ) as current_value
from public.investments i;
