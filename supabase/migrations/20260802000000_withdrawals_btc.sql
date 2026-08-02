-- Withdrawals: Bitcoin only, and never more than the investor actually has.
--
-- Both rules were previously enforced only in the browser, which means not
-- enforced at all — the RLS insert policy let an investor POST straight to
-- PostgREST with any address and any amount, including more than their balance.

-- ─────────────────────────────────────────────────────────────
-- Bitcoin address format.
--
-- Shape only — a real checksum (Base58Check / Bech32) needs more than a regex
-- and belongs in the payout pipeline when that is built. This catches typos,
-- pasted ETH addresses, and testnet addresses, which is what actually goes
-- wrong in practice.
--
--   1…   P2PKH legacy      Base58 alphabet (no 0, O, I, l)
--   3…   P2SH
--   bc1… Bech32 / Bech32m  (no 1, b, i, o), either all-lower or all-upper
--
-- Testnet (m…, n…, 2…, tb1…) is rejected: funds sent there are gone.
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_btc_address(addr text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    addr ~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$'
    or addr ~ '^bc1[023456789acdefghjklmnpqrstuvwxyz]{11,71}$'
    or addr ~ '^BC1[023456789ACDEFGHJKLMNPQRSTUVWXYZ]{11,71}$';
$$;

-- Existing rows may hold old-format (BEP-20) addresses, so validate only what
-- is written from now on. NOT VALID skips the backfill check.
alter table public.withdrawals
  add constraint withdrawals_btc_address
  check (bank_details is null or public.is_btc_address(bank_details))
  not valid;

comment on column public.withdrawals.bank_details is
  'Bitcoin payout address. Named bank_details for historical reasons.';

-- ─────────────────────────────────────────────────────────────
-- An investor cannot request more than they can actually withdraw.
--
-- Withdrawable = approved deposits that were never allocated to a plan,
--                minus withdrawals already approved,
--                minus withdrawals still pending (spoken for).
--
-- Capital inside an active investment is NOT withdrawable — it has to be
-- closed first. Without this an investor could drain their whole portfolio
-- value while the investments stayed open.
-- ─────────────────────────────────────────────────────────────
create or replace function public.withdrawable_balance(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    coalesce((
      select sum(d.amount) from public.deposits d
      where d.user_id = p_user_id
        and d.status = 'approved'
        and d.plan_id is null
        and d.allocated = false
    ), 0)
    - coalesce((
      select sum(w.amount) from public.withdrawals w
      where w.user_id = p_user_id
        and w.status in ('approved', 'pending')
    ), 0),
    0
  );
$$;

revoke execute on function public.withdrawable_balance(uuid) from public, anon;
grant execute on function public.withdrawable_balance(uuid) to authenticated, service_role;

create or replace function public.guard_withdrawal_amount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available numeric;
begin
  -- Admin corrections and server-side writes bypass this; only an investor
  -- filing their own request is constrained.
  if (select auth.uid()) is null or (select private.is_admin()) then
    return new;
  end if;

  -- withdrawable_balance already subtracts pending requests, and this trigger
  -- fires BEFORE the new row is visible, so no double-counting.
  v_available := public.withdrawable_balance(new.user_id);

  if new.amount > v_available then
    raise exception 'You can withdraw up to %, not %.',
      to_char(v_available, 'FM999,999,990.00'),
      to_char(new.amount, 'FM999,999,990.00');
  end if;

  return new;
end;
$$;

create trigger withdrawals_guard_amount
  before insert on public.withdrawals
  for each row execute function public.guard_withdrawal_amount();
