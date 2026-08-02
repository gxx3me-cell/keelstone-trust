-- Let investors withdraw against their investments, not just uninvested cash.
--
-- The previous rule limited withdrawals to approved deposits that were never
-- allocated to a plan. In practice every deposit goes straight into a plan, so
-- withdrawable was always 0 and the withdraw button did nothing for everybody.
--
-- New rule: an investor may withdraw up to their whole portfolio —
--
--   active investments (principal + accrued earnings)
--   + uninvested approved deposits
--   - withdrawals already approved
--   - withdrawals still pending
--
-- Settling a withdrawal against an open plan is an admin action (close or
-- reduce the investment), which is why this only governs what may be REQUESTED.
-- The payout pipeline, when it exists, will do the closing.

create or replace function public.withdrawable_balance(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    -- Current value of everything still invested. Mirrors the earnings maths in
    -- investments_with_earnings so the figure matches the dashboard.
    coalesce((
      select sum(
        i.principal
        + round(
            i.principal
              * (i.annual_return_pct / 100.0)
              * (extract(epoch from (now() - i.start_date)) / 31536000.0),
            2
          )
      )
      from public.investments i
      where i.user_id = p_user_id
        and i.status = 'active'
    ), 0)
    -- Plus cash that was never allocated to a plan.
    + coalesce((
      select sum(d.amount) from public.deposits d
      where d.user_id = p_user_id
        and d.status = 'approved'
        and d.plan_id is null
        and d.allocated = false
    ), 0)
    -- Less anything already paid out or awaiting payout.
    - coalesce((
      select sum(w.amount) from public.withdrawals w
      where w.user_id = p_user_id
        and w.status in ('approved', 'pending')
    ), 0),
    0
  );
$$;

comment on function public.withdrawable_balance(uuid) is
  'Total an investor may request: active investment value + uninvested cash, '
  'less approved and pending withdrawals. Guards withdrawal inserts.';
