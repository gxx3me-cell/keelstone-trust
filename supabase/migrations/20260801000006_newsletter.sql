-- The Keelstone Trust Investor Letter
--
-- Two audiences, one list:
--   * visitors who subscribe from the landing page footer (no account)
--   * investors who opt in from their dashboard (have an account)
--
-- `user_id` links the second kind so a signed-in investor's preference and
-- their subscription stay the same record.
--
-- Anonymous inserts are allowed — that is the whole point of a public
-- newsletter form — but they are write-only. Nobody without admin can read the
-- list back, so the form cannot be used to enumerate subscribers.

create table public.newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  user_id        uuid references auth.users(id) on delete set null,
  status         text not null default 'subscribed'
                   check (status in ('subscribed','unsubscribed')),
  source         text not null default 'landing'
                   check (source in ('landing','dashboard','import')),
  -- Lets someone unsubscribe from an email link without being signed in.
  unsubscribe_token uuid not null default gen_random_uuid(),
  subscribed_at    timestamptz not null default now(),
  unsubscribed_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- One row per address. Case-insensitive so Bright@x.com and bright@x.com are
-- the same person.
create unique index newsletter_email_key
  on public.newsletter_subscribers (lower(email));

create index newsletter_user_idx   on public.newsletter_subscribers (user_id);
create index newsletter_status_idx on public.newsletter_subscribers (status, subscribed_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Anyone may subscribe, including logged-out visitors. Constrained hard:
-- a fresh row must be 'subscribed' and cannot pre-set review columns.
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (
    status = 'subscribed'
    and unsubscribed_at is null
    and source in ('landing','dashboard')
  );

-- Deliberately NO select policy for anon/authenticated non-admins: the list is
-- not readable by the public. A signed-in investor may see only their own row.
create policy "investors read own subscription"
  on public.newsletter_subscribers for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "investors update own subscription"
  on public.newsletter_subscribers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "admins manage subscribers"
  on public.newsletter_subscribers for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Subscribing twice must not error — the form should feel idempotent.
-- Re-subscribing a previously unsubscribed address reactivates it.
-- SECURITY DEFINER so an anonymous caller can upsert without a select grant
-- (which would otherwise leak whether an address is already on the list).
-- ─────────────────────────────────────────────────────────────
create or replace function public.subscribe_to_newsletter(
  p_email  text,
  p_source text default 'landing'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address.';
  end if;

  if p_source not in ('landing','dashboard') then
    raise exception 'Invalid source.';
  end if;

  insert into public.newsletter_subscribers (email, user_id, source, status)
  values (v_email, (select auth.uid()), p_source, 'subscribed')
  on conflict (lower(email)) do update
    set status          = 'subscribed',
        unsubscribed_at = null,
        subscribed_at   = now(),
        -- Claim the row for the signed-in user if it was created anonymously.
        user_id         = coalesce(public.newsletter_subscribers.user_id, (select auth.uid()));
end;
$$;

revoke execute on function public.subscribe_to_newsletter(text, text) from public;
grant execute on function public.subscribe_to_newsletter(text, text) to anon, authenticated;

-- Unsubscribe for a signed-in investor (dashboard toggle).
create or replace function public.unsubscribe_from_newsletter()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.newsletter_subscribers
  set status = 'unsubscribed', unsubscribed_at = now()
  where user_id = (select auth.uid());
$$;

revoke execute on function public.unsubscribe_from_newsletter() from public, anon;
grant execute on function public.unsubscribe_from_newsletter() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- When someone signs up, adopt any subscription they made earlier with the
-- same address so the dashboard toggle reflects reality.
-- ─────────────────────────────────────────────────────────────
create or replace function public.link_newsletter_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.newsletter_subscribers
  set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$$;

create trigger link_newsletter_after_profile
  after insert on public.profiles
  for each row execute function public.link_newsletter_on_signup();
