-- Admin notification feed
--
-- Rows are written by triggers, never by the client. That matters: the events
-- worth notifying on (a signup, a deposit landing, a withdrawal request) all
-- happen through paths the browser can't be trusted to report honestly, and
-- some of them (signup) happen with no session at all.
--
-- Read state is per-admin, so it cannot live on the notification row itself —
-- two admins would overwrite each other. It goes in notification_reads.

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null
                check (kind in ('user','deposit','withdrawal','message','investment','kyc')),
  title       text not null,
  body        text,
  -- Who the event is about. Kept denormalised: the feed must still read
  -- correctly after the underlying row is deleted.
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  amount      numeric(14,2),
  -- Row that triggered this, for deep-linking. No FK: it points at several
  -- different tables and must survive their deletion.
  entity_id   uuid,
  created_at  timestamptz not null default now()
);

create index notifications_created_idx on public.notifications (created_at desc);
create index notifications_kind_idx    on public.notifications (kind, created_at desc);

alter table public.notifications enable row level security;

-- Admins only. No insert/update/delete policy exists for anyone: the triggers
-- below are SECURITY DEFINER and bypass RLS, so the client can never forge or
-- tamper with a notification.
create policy "admins read notifications"
  on public.notifications for select
  to authenticated
  using ((select private.is_admin()));


-- ── per-admin read state ────────────────────────────────────────────────

create table public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  admin_id        uuid not null references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, admin_id)
);

alter table public.notification_reads enable row level security;

create policy "admins read own read-state"
  on public.notification_reads for select
  to authenticated
  using (admin_id = (select auth.uid()) and (select private.is_admin()));

create policy "admins mark own read-state"
  on public.notification_reads for insert
  to authenticated
  with check (admin_id = (select auth.uid()) and (select private.is_admin()));

create policy "admins clear own read-state"
  on public.notification_reads for delete
  to authenticated
  using (admin_id = (select auth.uid()) and (select private.is_admin()));


-- ── writer ──────────────────────────────────────────────────────────────

create or replace function private.notify(
  p_kind        text,
  p_title       text,
  p_body        text    default null,
  p_actor_id    uuid    default null,
  p_actor_email text    default null,
  p_amount      numeric default null,
  p_entity_id   uuid    default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (kind, title, body, actor_id, actor_email, amount, entity_id)
  values (p_kind, p_title, p_body, p_actor_id, p_actor_email, p_amount, p_entity_id);
$$;


-- ── triggers ────────────────────────────────────────────────────────────

-- New investor. Fires off profiles (not auth.users) so it runs after
-- handle_new_user() has populated the name.
create or replace function public.notify_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'investor' then
    perform private.notify(
      'user',
      'New investor registered',
      coalesce(nullif(trim(new.full_name), ''), new.email),
      new.id,
      new.email
    );
  end if;
  return new;
end;
$$;

create trigger notify_new_profile
  after insert on public.profiles
  for each row execute function public.notify_new_profile();


-- Deposits: on filing, and again whenever an admin changes the status.
create or replace function public.notify_deposit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name  text;
begin
  select p.email, coalesce(nullif(trim(p.full_name), ''), p.email)
    into v_email, v_name
    from public.profiles p where p.id = new.user_id;

  if tg_op = 'INSERT' then
    perform private.notify(
      'deposit',
      'Deposit awaiting approval',
      v_name || coalesce(' · ' || new.plan_name, ''),
      new.user_id, v_email, new.amount, new.id
    );
  elsif new.status is distinct from old.status then
    perform private.notify(
      'deposit',
      'Deposit ' || new.status,
      v_name || coalesce(' · ' || new.plan_name, ''),
      new.user_id, v_email, new.amount, new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_deposit_insert
  after insert on public.deposits
  for each row execute function public.notify_deposit();

create trigger notify_deposit_status
  after update of status on public.deposits
  for each row execute function public.notify_deposit();


create or replace function public.notify_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name  text;
begin
  select p.email, coalesce(nullif(trim(p.full_name), ''), p.email)
    into v_email, v_name
    from public.profiles p where p.id = new.user_id;

  if tg_op = 'INSERT' then
    perform private.notify(
      'withdrawal', 'Withdrawal requested', v_name,
      new.user_id, v_email, new.amount, new.id
    );
  elsif new.status is distinct from old.status then
    perform private.notify(
      'withdrawal', 'Withdrawal ' || new.status, v_name,
      new.user_id, v_email, new.amount, new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_withdrawal_insert
  after insert on public.withdrawals
  for each row execute function public.notify_withdrawal();

create trigger notify_withdrawal_status
  after update of status on public.withdrawals
  for each row execute function public.notify_withdrawal();


-- Inbound support mail only — an admin's own reply is not news to them.
create or replace function public.notify_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.direction = 'inbound' then
    perform private.notify(
      'message',
      'New support message',
      coalesce(nullif(trim(new.subject), ''), left(coalesce(new.message, ''), 60), '(no subject)'),
      new.user_id, new.email, null, new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_message
  after insert on public.messages
  for each row execute function public.notify_message();


create or replace function public.notify_investment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name  text;
begin
  select p.email, coalesce(nullif(trim(p.full_name), ''), p.email)
    into v_email, v_name
    from public.profiles p where p.id = new.user_id;

  perform private.notify(
    'investment',
    'Investment activated',
    v_name || coalesce(' · ' || new.plan_name, ''),
    new.user_id, v_email, new.principal, new.id
  );
  return new;
end;
$$;

create trigger notify_investment
  after insert on public.investments
  for each row execute function public.notify_investment();


-- KYC: filed, then approved/rejected.
create or replace function public.notify_kyc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select p.email into v_email from public.profiles p where p.id = new.user_id;

  if tg_op = 'INSERT' then
    perform private.notify(
      'kyc', 'KYC submitted for review', new.full_name,
      new.user_id, v_email, null, new.id
    );
  elsif new.status is distinct from old.status then
    perform private.notify(
      'kyc', 'KYC ' || new.status, new.full_name,
      new.user_id, v_email, null, new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_kyc_insert
  after insert on public.kyc_submissions
  for each row execute function public.notify_kyc();

create trigger notify_kyc_status
  after update of status on public.kyc_submissions
  for each row execute function public.notify_kyc();


-- ── feed view: notifications + whether the caller has read them ─────────

create or replace view public.notifications_for_me
with (security_invoker = true) as
  select
    n.*,
    (r.notification_id is not null) as is_read
  from public.notifications n
  left join public.notification_reads r
    on r.notification_id = n.id
   and r.admin_id = (select auth.uid());

comment on view public.notifications_for_me is
  'Admin feed with per-caller read state. security_invoker keeps the underlying RLS in force.';
