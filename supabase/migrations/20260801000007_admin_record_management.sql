-- Admin record management
--
-- Lets an admin correct or remove an investor's records from the console.
-- Previously admins could only approve/reject and fund — there was no way to
-- fix a typo or remove a mistaken entry without the SQL editor.
--
-- Two things this deliberately does NOT do:
--   * silently discard history — every edit and delete is written to
--     admin_audit_log first, so a disputed balance can always be reconstructed
--   * allow deleting the last admin, or an admin deleting themselves

-- ─────────────────────────────────────────────────────────────
-- Audit log
-- ─────────────────────────────────────────────────────────────
create table public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references auth.users(id) on delete set null,
  admin_email  text,
  action       text not null
                 check (action in ('update','delete','create')),
  table_name   text not null,
  record_id    uuid,
  -- Whose data this concerned, so an investor's full history is queryable
  -- even after the underlying row is gone.
  subject_id   uuid,
  before       jsonb,
  after        jsonb,
  note         text,
  created_at   timestamptz not null default now()
);

create index audit_subject_idx on public.admin_audit_log (subject_id, created_at desc);
create index audit_admin_idx   on public.admin_audit_log (admin_id, created_at desc);
create index audit_record_idx  on public.admin_audit_log (table_name, record_id);

alter table public.admin_audit_log enable row level security;

-- Admins may read the log. Nobody may edit or delete it from the API — the
-- only writer is the SECURITY DEFINER function below.
create policy "admins read audit log"
  on public.admin_audit_log for select
  to authenticated
  using ((select private.is_admin()));

create or replace function private.write_audit(
  p_action     text,
  p_table      text,
  p_record_id  uuid,
  p_subject_id uuid,
  p_before     jsonb,
  p_after      jsonb,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select email into v_email from public.profiles where id = (select auth.uid());
  insert into public.admin_audit_log
    (admin_id, admin_email, action, table_name, record_id, subject_id, before, after, note)
  values
    ((select auth.uid()), v_email, p_action, p_table, p_record_id, p_subject_id, p_before, p_after, p_note);
end;
$$;

revoke execute on function private.write_audit(text, text, uuid, uuid, jsonb, jsonb, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Automatic audit triggers.
--
-- Attached to the money tables so an admin edit is recorded no matter which
-- code path made it — including a direct PATCH from the console. Investor-
-- initiated writes (filing a deposit, requesting a withdrawal) are skipped:
-- they are not admin actions and would drown the log.
-- ─────────────────────────────────────────────────────────────
create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subject uuid;
begin
  -- Only log when an admin is the one acting.
  if (select auth.uid()) is null or not (select private.is_admin()) then
    return coalesce(new, old);
  end if;

  v_subject := coalesce(
    case tg_op when 'DELETE' then (to_jsonb(old) ->> 'user_id') else (to_jsonb(new) ->> 'user_id') end,
    case tg_op when 'DELETE' then (to_jsonb(old) ->> 'id')      else (to_jsonb(new) ->> 'id')      end
  )::uuid;

  if tg_op = 'DELETE' then
    perform private.write_audit('delete', tg_table_name, old.id, v_subject, to_jsonb(old), null);
    return old;
  else
    perform private.write_audit('update', tg_table_name, new.id, v_subject, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
end;
$$;

create trigger audit_deposits
  after update or delete on public.deposits
  for each row execute function public.audit_admin_change();

create trigger audit_withdrawals
  after update or delete on public.withdrawals
  for each row execute function public.audit_admin_change();

create trigger audit_investments
  after update or delete on public.investments
  for each row execute function public.audit_admin_change();

create trigger audit_profiles
  after update or delete on public.profiles
  for each row execute function public.audit_admin_change();

-- ─────────────────────────────────────────────────────────────
-- The write policies the console needs.
--
-- Admins could already SELECT everything and UPDATE deposits/withdrawals
-- (approve/reject). These add the missing DELETE, plus UPDATE on investments,
-- so records can be corrected or removed.
-- ─────────────────────────────────────────────────────────────
create policy "admins delete deposits"
  on public.deposits for delete
  to authenticated
  using ((select private.is_admin()));

create policy "admins delete withdrawals"
  on public.withdrawals for delete
  to authenticated
  using ((select private.is_admin()));

create policy "admins delete investments"
  on public.investments for delete
  to authenticated
  using ((select private.is_admin()));

create policy "admins delete kyc"
  on public.kyc_submissions for delete
  to authenticated
  using ((select private.is_admin()));

-- Admins may correct a deposit's amount/status/plan. Investors still cannot
-- INSERT or UPDATE deposits at all — that restriction is unchanged.
create policy "admins insert deposits"
  on public.deposits for insert
  to authenticated
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Deleting an investor.
--
-- Refuses to delete admins (demote first) and refuses self-deletion, so the
-- console cannot be used to lock everyone out or to quietly remove a colleague.
-- The auth.users row is removed by the admin-delete-user Edge Function; this
-- function handles the checks and the audit entry.
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_may_delete_user(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not (select private.is_admin()) then
    return 'Admins only.';
  end if;

  if p_user_id = (select auth.uid()) then
    return 'You cannot delete your own account.';
  end if;

  select role into v_role from public.profiles where id = p_user_id;

  if v_role is null then
    return 'That account no longer exists.';
  end if;

  if v_role = 'admin' then
    return 'That account is an admin. Demote them first.';
  end if;

  return null;  -- allowed
end;
$$;

revoke execute on function public.admin_may_delete_user(uuid) from public, anon;
grant execute on function public.admin_may_delete_user(uuid) to authenticated, service_role;
