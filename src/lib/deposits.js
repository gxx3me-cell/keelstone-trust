// Manual deposit flow.
//
// Investors deposit by sending funds to a wallet an admin publishes, then
// filing a request. Nothing is credited automatically — an admin verifies the
// transfer and approves it.
//
// Reads go straight to Postgres under RLS. The two writes that move money
// (filing a deposit, approving one) go through Edge Functions instead: there is
// deliberately no INSERT policy on `deposits` for investors, because a user who
// could insert their own row could credit themselves any amount.
import { supabase } from './supabase'

// Supabase returns { data, error } rather than throwing.
function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/* ── deposit methods ─────────────────────────────────────── */

// Active methods, for the investor-facing picker. RLS hides inactive ones.
export async function listDepositMethods() {
  return unwrap(
    await supabase
      .from('deposit_methods')
      .select('*')
      .eq('active', true)
      .order('sort_order')
  ) ?? []
}

// Every method including hidden ones. RLS returns the full set only to admins.
export async function listAllDepositMethods() {
  return unwrap(
    await supabase.from('deposit_methods').select('*').order('sort_order')
  ) ?? []
}

// Create (omit id) or update (pass id). Admin only, enforced by RLS.
export async function saveDepositMethod({ id, ...fields }) {
  const row = {
    name: fields.name?.trim(),
    symbol: (fields.symbol || '').trim().toUpperCase() || null,
    network: (fields.network || '').trim() || null,
    wallet_address: fields.wallet_address?.trim(),
    instructions: (fields.instructions || '').trim() || null,
    min_amount: Number(fields.min_amount) || 0,
    active: fields.active !== false,
    sort_order: Number(fields.sort_order) || 0,
  }
  if (!row.name) throw new Error('Give the deposit method a name (e.g. Bitcoin).')
  if (!row.wallet_address) throw new Error('A wallet address is required.')

  return id
    ? unwrap(await supabase.from('deposit_methods').update(row).eq('id', id).select().single())
    : unwrap(await supabase.from('deposit_methods').insert(row).select().single())
}

export async function deleteDepositMethod(id) {
  return unwrap(await supabase.from('deposit_methods').delete().eq('id', id))
}

/* ── deposits ────────────────────────────────────────────── */

// File a pending deposit request. `planId` is optional — without it the funds
// land in the investor's available balance once approved.
export async function submitDeposit({ amount, methodId, planId, reference }) {
  const { data, error } = await supabase.functions.invoke('submit-deposit', {
    body: {
      amount: String(amount),
      method_id: methodId,
      plan_id: planId || null,
      reference: reference || '',
    },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

// Admin: approve or reject a pending deposit or withdrawal.
export async function reviewRequest({ type, recordId, action, note = '' }) {
  const { data, error } = await supabase.functions.invoke('admin-action', {
    body: { type, record_id: recordId, action, note },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

/* ── portfolio ───────────────────────────────────────────── */

// Everything the investor dashboard renders. Previously a cloud function;
// now three RLS-scoped reads plus arithmetic. `investments_with_earnings` is a
// security_invoker view, so it only ever returns the caller's own rows.
export async function getMyPortfolio() {
  const [investments, deposits, withdrawals] = await Promise.all([
    supabase.from('investments_with_earnings').select('*').eq('status', 'active'),
    supabase.from('deposits').select('*').order('created_at', { ascending: false }),
    supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
  ])
  if (investments.error) throw new Error(investments.error.message)
  if (deposits.error) throw new Error(deposits.error.message)
  if (withdrawals.error) throw new Error(withdrawals.error.message)

  // numeric columns arrive as strings to preserve precision — coerce before
  // any arithmetic, or "100" + 50 silently becomes "10050".
  const n = (v) => Number(v || 0)

  const invs = (investments.data || []).map((i) => ({
    ...i,
    principal: n(i.principal),
    annual_return_pct: n(i.annual_return_pct),
    earnings: n(i.earnings),
    current_value: n(i.current_value),
  }))

  const deps = (deposits.data || []).map((d) => ({ ...d, amount: n(d.amount) }))
  const wds = (withdrawals.data || []).map((w) => ({ ...w, amount: n(w.amount) }))

  const total_principal = invs.reduce((s, i) => s + i.principal, 0)
  const total_earnings = invs.reduce((s, i) => s + i.earnings, 0)

  const pending = deps.filter((d) => d.status === 'pending')
  // An approved deposit with no plan is spendable balance. Approved deposits
  // that named a plan already became an investment.
  const credited = deps
    .filter((d) => d.status === 'approved' && !d.plan_id && !d.allocated)
    .reduce((s, d) => s + d.amount, 0)
  const withdrawn = wds
    .filter((w) => w.status === 'approved')
    .reduce((s, w) => s + w.amount, 0)

  return {
    investment_count: invs.length,
    investments: invs,
    total_principal: round2(total_principal),
    total_earnings: round2(total_earnings),
    total_value: round2(total_principal + total_earnings),
    return_pct: total_principal ? round2((total_earnings / total_principal) * 100) : 0,
    available_balance: round2(Math.max(credited - withdrawn, 0)),
    pending_total: round2(pending.reduce((s, d) => s + d.amount, 0)),
    pending_count: pending.length,
    deposits: deps,
    withdrawals: wds,
  }
}

const round2 = (v) => Math.round(v * 100) / 100

/* ── withdrawals ─────────────────────────────────────────── */

// Investors may file their own withdrawal — the RLS policy pins user_id to the
// caller and forces status to 'pending'.
export async function submitWithdrawal({ amount, address, network = 'USDT BEP-20' }) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) throw new Error('You must be signed in.')

  return unwrap(
    await supabase
      .from('withdrawals')
      .insert({
        user_id: auth.user.id,
        amount: Number(amount),
        bank_details: address,
        network,
        status: 'pending',
      })
      .select()
      .single()
  )
}

/* ── plans ───────────────────────────────────────────────── */

export async function listPlans() {
  const rows = unwrap(
    await supabase.from('plans').select('*').eq('active', true).order('sort_order')
  ) ?? []
  return rows.map((p) => ({
    ...p,
    min_usd: Number(p.min_usd || 0),
    max_usd: Number(p.max_usd || 0),
    annual_return_pct: Number(p.annual_return_pct || 0),
  }))
}
