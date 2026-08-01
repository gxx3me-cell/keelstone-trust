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
