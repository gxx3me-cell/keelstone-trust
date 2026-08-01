// Admin data access.
//
// Every read here is RLS-gated: `private.is_admin()` decides what comes back,
// so a non-admin calling these gets empty results rather than an error. The UI
// still checks `isAdmin` first — that's for rendering, not for security.

import { supabase } from './supabase'

/** Everything the admin console needs, in one round trip. */
export async function loadAdminData() {
  const [profiles, deposits, withdrawals, plans, investments, messages] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('deposits').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('plans').select('*').order('sort_order', { ascending: true }),
    supabase.from('investments_with_earnings').select('*').limit(500),
    supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  const rows = (r) => (r.error ? [] : (r.data ?? []))

  return {
    profiles: rows(profiles),
    deposits: rows(deposits),
    withdrawals: rows(withdrawals),
    plans: rows(plans),
    investments: rows(investments),
    messages: rows(messages),
  }
}

/* ── investors ──────────────────────────────────────────── */

export const displayName = (p) =>
  p?.full_name?.trim() ||
  [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() ||
  p?.email ||
  'Unknown'

export const initialsOf = (p) => {
  const n = displayName(p)
  const parts = n.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || n.slice(0, 2).toUpperCase()
}

/** Totals for one investor, from the earnings view. */
export function investorTotals(userId, investments) {
  let principal = 0, earnings = 0, count = 0
  for (const inv of investments) {
    if (inv.user_id !== userId || inv.status !== 'active') continue
    principal += Number(inv.principal || 0)
    earnings += Number(inv.earnings || 0)
    count++
  }
  return { principal, earnings, value: principal + earnings, count }
}

/* ── plans ──────────────────────────────────────────────── */

export async function savePlan({ id, ...fields }) {
  const row = {
    name: fields.name?.trim(),
    slug: fields.slug?.trim() || fields.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    annual_return_pct: Number(fields.annual_return_pct) || 0,
    min_usd: Number(fields.min_usd) || 0,
    max_usd: Number(fields.max_usd) || 0,
    risk: fields.risk || null,
    assets: fields.assets || null,
    strategy: fields.strategy || null,
    perks: Array.isArray(fields.perks) ? fields.perks : [],
    featured: !!fields.featured,
    active: fields.active !== false,
    sort_order: Number(fields.sort_order) || 0,
  }

  const q = id
    ? supabase.from('plans').update(row).eq('id', id).select().single()
    : supabase.from('plans').insert(row).select().single()

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data
}

export async function deletePlan(id) {
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ── messages ───────────────────────────────────────────── */

export async function sendEmail({ to, subject, body, messageId }) {
  const { data, error } = await supabase.functions.invoke('support-email', {
    body: { to_email: to, subject, body, message_id: messageId ?? null },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export async function deleteMessage(id) {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ── investor funding (admin-initiated) ─────────────────── */

// Creating an investment for someone else needs privileges the browser key
// doesn't have, so it goes through an Edge Function.
export async function fundInvestor({ userId, planId, amount }) {
  const { data, error } = await supabase.functions.invoke('admin-fund', {
    body: { action: 'fund', user_id: userId, plan_id: planId, amount },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export async function closeInvestment(investmentId) {
  const { data, error } = await supabase.functions.invoke('admin-fund', {
    body: { action: 'defund', investment_id: investmentId },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

/* ── investor record management ─────────────────────────── */
//
// Every write below is admin-only via RLS, and every one is captured by the
// audit_admin_change trigger — so a corrected amount or a deleted deposit
// leaves a trace in admin_audit_log even though the row itself changed.

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

/** Everything on file for one investor, for the detail view. */
export async function loadInvestorDetail(userId) {
  const [profile, deposits, investments, withdrawals, kyc, audit, subscription] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('deposits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('investments_with_earnings').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    supabase.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('kyc_submissions').select('*').eq('user_id', userId).order('submitted_at', { ascending: false }),
    supabase.from('admin_audit_log').select('*').eq('subject_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('newsletter_subscribers').select('status').eq('user_id', userId).maybeSingle(),
  ])

  const rows = (r) => (r.error ? [] : (r.data ?? []))
  return {
    profile: profile.error ? null : profile.data,
    deposits: rows(deposits),
    investments: rows(investments),
    withdrawals: rows(withdrawals),
    kyc: rows(kyc),
    audit: rows(audit),
    subscribed: subscription.error ? null : subscription.data?.status === 'subscribed',
  }
}

/** Edit an investor's name. Email is managed by Supabase Auth, not here. */
export async function updateProfile(userId, { first_name, last_name }) {
  const full = [first_name, last_name].map((s) => (s || '').trim()).filter(Boolean).join(' ')
  return ok(await supabase
    .from('profiles')
    .update({
      first_name: (first_name || '').trim() || null,
      last_name: (last_name || '').trim() || null,
      full_name: full || null,
    })
    .eq('id', userId)
    .select()
    .single())
}

/** Set an investor's KYC status by hand (overrides the submission flow). */
export async function setKycStatus(userId, status) {
  return ok(await supabase.from('profiles').update({ kyc_status: status }).eq('id', userId).select().single())
}

const MONEY_TABLES = { deposit: 'deposits', withdrawal: 'withdrawals', investment: 'investments' }

/** Correct a deposit, withdrawal or investment record. */
export async function updateRecord(type, id, fields) {
  const table = MONEY_TABLES[type]
  if (!table) throw new Error(`Unknown record type: ${type}`)

  // Only ever send the columns the console is allowed to edit — passing the
  // whole row back would clobber reviewed_by/created_at with stale values.
  const allowed = {
    deposit: ['amount', 'status', 'plan_id', 'plan_name', 'method_label', 'reference', 'tx_hash', 'admin_note', 'allocated'],
    withdrawal: ['amount', 'status', 'bank_details', 'network', 'admin_note'],
    investment: ['principal', 'annual_return_pct', 'plan_name', 'status', 'start_date'],
  }[type]

  const patch = {}
  for (const k of allowed) if (k in fields) patch[k] = fields[k]
  if (!Object.keys(patch).length) throw new Error('Nothing to update.')

  return ok(await supabase.from(table).update(patch).eq('id', id).select().single())
}

/** Delete a single record. The audit trigger snapshots it first. */
export async function deleteRecord(type, id) {
  const table = MONEY_TABLES[type]
  if (!table) throw new Error(`Unknown record type: ${type}`)
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Delete an investor and everything belonging to them.
 * Goes through an Edge Function: removing an auth.users row needs the service
 * role, and the function refuses to delete admins or the caller themselves.
 */
export async function deleteInvestor(userId, note = '') {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { user_id: userId, note },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

/** Promote or demote. Blocked for self — the trigger enforces it server-side. */
export async function setRole(userId, role) {
  if (!['investor', 'admin'].includes(role)) throw new Error('Invalid role.')
  return ok(await supabase.from('profiles').update({ role }).eq('id', userId).select().single())
}
