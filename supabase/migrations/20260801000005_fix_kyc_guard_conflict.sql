-- Fix: investors could not submit KYC at all.
--
-- Two triggers were fighting on public.profiles:
--
--   sync_kyc_status()          — mirrors a submission onto profiles.kyc_status
--   guard_profile_privileges() — stops a user editing their own role/kyc_status
--
-- Both are SECURITY DEFINER, but the guard reads auth.uid(), which is still the
-- *investor* when their own INSERT into kyc_submissions cascades into the sync.
-- The guard therefore rejected its own system's write with
-- "KYC status is set by the compliance team." and the whole submission failed.
--
-- Fix: the sync sets a transaction-local flag before it writes, and the guard
-- honours it. set_config(..., true) is scoped to the transaction, so the flag
-- cannot leak between statements or sessions, and PostgREST gives the client no
-- way to set a GUC — only our own SECURITY DEFINER function can raise it.

create or replace function public.sync_kyc_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Mark this transaction as performing a trusted, system-initiated sync.
  perform set_config('app.kyc_sync', 'on', true);

  update public.profiles
  set kyc_status = case new.status
                     when 'submitted' then 'pending'
                     when 'approved'  then 'approved'
                     when 'rejected'  then 'rejected'
                   end
  where id = new.user_id;

  -- Lower it again so nothing later in the same transaction inherits the pass.
  perform set_config('app.kyc_sync', 'off', true);
  return new;
end;
$$;

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

  -- A kyc_status change written by sync_kyc_status() is legitimate: it is
  -- derived from a row in kyc_submissions, which has its own RLS forcing
  -- user_id = auth.uid() and status = 'submitted' on insert. An investor still
  -- cannot set their own status directly, because that path never raises this
  -- flag.
  if new.kyc_status is distinct from old.kyc_status
     and coalesce(current_setting('app.kyc_sync', true), 'off') <> 'on' then
    raise exception 'KYC status is set by the compliance team.';
  end if;

  if new.role is distinct from old.role then
    raise exception 'You cannot change your own role.';
  end if;

  return new;
end;
$$;
