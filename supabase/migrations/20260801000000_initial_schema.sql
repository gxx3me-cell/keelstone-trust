-- Keelstone Trust — initial schema
--
-- Replaces the CocoBase schemaless `data` JSON blobs with real Postgres types.
-- Money is numeric (never float). Timestamps are timestamptz. Enums are text
-- with check constraints.

-- ─────────────────────────────────────────────────────────────
-- Private schema for security-definer helpers.
-- Nothing here is reachable through the Data API.
-- ─────────────────────────────────────────────────────────────
create schema if not exists private;

-- ─────────────────────────────────────────────────────────────
-- profiles — extends auth.users with role + KYC state
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text,
  first_name            text,
  last_name             text,
  full_name             text,
  role                  text not null default 'investor'
                          check (role in ('investor','admin')),
  kyc_status            text not null default 'not_started'
                          check (kyc_status in ('not_started','pending','approved','rejected')),
  welcome_email_sent_at timestamptz,
  created_at            timestamptz not null default now()
);

comment on column public.profiles.role is
  'Authorization source of truth. Deliberately NOT in user_metadata, which is user-editable.';

-- ─────────────────────────────────────────────────────────────
-- plans
-- ─────────────────────────────────────────────────────────────
create table public.plans (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique,
  annual_return_pct numeric(6,2) not null default 0 check (annual_return_pct >= 0),
  min_usd           numeric(14,2) not null default 0 check (min_usd >= 0),
  max_usd           numeric(14,2) not null default 0 check (max_usd >= 0),
  risk              text,
  assets            text,
  strategy          text,
  perks             jsonb not null default '[]'::jsonb,
  featured          boolean not null default false,
  active            boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  -- 0 means "no maximum"; otherwise it must exceed the minimum
  constraint plans_max_gte_min check (max_usd = 0 or max_usd >= min_usd)
);

-- ─────────────────────────────────────────────────────────────
-- deposit_methods — the wallets investors are told to send to
-- ─────────────────────────────────────────────────────────────
create table public.deposit_methods (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  symbol         text,
  network        text,
  wallet_address text not null,
  instructions   text,
  min_amount     numeric(14,2) not null default 0 check (min_amount >= 0),
  active         boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- deposits — filed by the investor, confirmed by an admin
-- ─────────────────────────────────────────────────────────────
create table public.deposits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  amount            numeric(14,2) not null check (amount > 0),
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  method_id         uuid references public.deposit_methods(id) on delete set null,
  method_label      text,
  wallet_address    text,
  plan_id           uuid references public.plans(id) on delete set null,
  plan_name         text,
  annual_return_pct numeric(6,2) not null default 0,
  reference         text,
  tx_hash           text,
  allocated         boolean not null default false,
  admin_note        text,
  reviewed_by       uuid references auth.users(id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

comment on column public.deposits.allocated is
  'True once an approved deposit has been turned into an investment, so the '
  'available-balance calculation does not double-count it.';

-- ─────────────────────────────────────────────────────────────
-- investments
-- ─────────────────────────────────────────────────────────────
create table public.investments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan_id           uuid references public.plans(id) on delete set null,
  plan_name         text,
  principal         numeric(14,2) not null check (principal > 0),
  annual_return_pct numeric(6,2) not null default 0,
  status            text not null default 'active'
                      check (status in ('active','closed')),
  start_date        timestamptz not null default now(),
  closed_at         timestamptz,
  source_deposit_id uuid references public.deposits(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- withdrawals
-- ─────────────────────────────────────────────────────────────
create table public.withdrawals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(14,2) not null check (amount > 0),
  status       text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  bank_details text,
  network      text,
  admin_note   text,
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- messages — support inbox
-- ─────────────────────────────────────────────────────────────
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  name       text,
  email      text,
  subject    text,
  message    text,
  direction  text not null default 'inbound'
               check (direction in ('inbound','outbound')),
  status     text not null default 'new'
               check (status in ('new','replied')),
  reply_body text,
  replied_by text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes.
-- Every column used in an RLS policy is indexed — without this each
-- policy check degrades into a sequential scan.
-- ─────────────────────────────────────────────────────────────
create index deposits_user_status_idx    on public.deposits    (user_id, status);
create index deposits_created_idx        on public.deposits    (created_at desc);
create index deposits_method_idx         on public.deposits    (method_id);
create index deposits_plan_idx           on public.deposits    (plan_id);
create index deposits_reviewed_by_idx    on public.deposits    (reviewed_by);
create index investments_user_status_idx on public.investments (user_id, status);
create index investments_plan_idx        on public.investments (plan_id);
create index investments_deposit_idx     on public.investments (source_deposit_id);
create index withdrawals_user_status_idx on public.withdrawals (user_id, status);
create index withdrawals_created_idx     on public.withdrawals (created_at desc);
create index withdrawals_reviewed_by_idx on public.withdrawals (reviewed_by);
create index messages_status_created_idx on public.messages    (status, created_at desc);
create index messages_user_idx           on public.messages    (user_id);
create index plans_active_sort_idx       on public.plans       (active, sort_order);
create index deposit_methods_active_idx  on public.deposit_methods (active, sort_order);

-- ─────────────────────────────────────────────────────────────
-- Create a profile whenever a user signs up.
-- Without this a new account has no profile row and therefore no role.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
