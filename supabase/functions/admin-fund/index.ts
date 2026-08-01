// admin-fund
//
// Admin credits an investor directly (no deposit request), or closes an
// existing investment.
//
// This exists for money moved outside the normal flow — a wire transfer, a
// migrated balance, a correction. Every action writes a matching `deposits`
// row so the audit trail shows where the funds came from.
//
// Body:
//   { action: 'fund',   user_id, amount, plan_id? }
//   { action: 'defund', investment_id }

import { preflight, json, getCaller, adminClient, displayName, firstNameOf } from '../_shared/auth.ts'
import { sendMail, depositReviewedEmail, money } from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight()
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const caller = await getCaller(req)
  if (!caller) return json({ error: 'You must be signed in.' }, 401)
  if (!caller.isAdmin) return json({ error: 'Admins only.' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const admin = adminClient()
  const action = String(body.action ?? '')
  const now = new Date().toISOString()

  /* ── defund: close an active investment ── */
  if (action === 'defund') {
    const investmentId = String(body.investment_id ?? '').trim()
    if (!investmentId) return json({ error: 'Missing investment id.' }, 400)

    const { data: closed, error } = await admin
      .from('investments')
      .update({ status: 'closed', closed_at: now })
      .eq('id', investmentId)
      .eq('status', 'active')
      .select()

    if (error) {
      console.error('defund failed:', error)
      return json({ error: 'Could not close the investment.' }, 500)
    }
    if (!closed || closed.length === 0) {
      return json({ error: 'That investment is not active.' }, 400)
    }
    return json({ ok: true, closed: closed[0].id })
  }

  /* ── fund: credit an investor ── */
  if (action !== 'fund') return json({ error: `Unknown action '${action}'.` }, 400)

  const userId = String(body.user_id ?? '').trim()
  const amount = Number(String(body.amount ?? '').replace(/,/g, '').trim())
  const planId = String(body.plan_id ?? '').trim() || null

  if (!userId) return json({ error: 'Missing investor.' }, 400)
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'Enter a valid amount.' }, 400)

  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!profile) return json({ error: 'That investor no longer exists.' }, 404)

  let planName: string | null = null
  let annualReturnPct = 0
  if (planId) {
    const { data: plan } = await admin.from('plans').select('*').eq('id', planId).maybeSingle()
    if (!plan) return json({ error: 'That plan no longer exists.' }, 400)
    planName = plan.name
    annualReturnPct = Number(plan.annual_return_pct ?? 0)
  }

  // Audit row: pre-approved, attributed to the admin who did it.
  const { data: deposit, error: depError } = await admin
    .from('deposits')
    .insert({
      user_id: userId,
      amount,
      status: 'approved',
      method_label: 'Admin credit',
      plan_id: planId,
      plan_name: planName,
      annual_return_pct: annualReturnPct,
      admin_note: `Funded directly by ${displayName(caller.profile, caller.email)}`,
      reviewed_by: caller.id,
      reviewed_at: now,
      allocated: !!planId,
    })
    .select()
    .single()

  if (depError) {
    console.error('admin credit insert failed:', depError)
    return json({ error: 'Could not record the credit.' }, 500)
  }

  if (planId) {
    const { error: invError } = await admin.from('investments').insert({
      user_id: userId,
      plan_id: planId,
      plan_name: planName,
      principal: amount,
      annual_return_pct: annualReturnPct,
      status: 'active',
      start_date: now,
      source_deposit_id: deposit.id,
    })
    if (invError) {
      // Undo the audit row rather than leave a credit with no investment.
      console.error('investment insert failed, reverting credit:', invError)
      await admin.from('deposits').delete().eq('id', deposit.id)
      return json({ error: 'Could not open the investment. Nothing was changed.' }, 500)
    }
  }

  if (profile.email) {
    await sendMail({
      to: profile.email,
      subject: `Your $${money(amount)} deposit is confirmed`,
      idempotencyKey: `admin-fund-${deposit.id}`,
      html: depositReviewedEmail({
        firstName: firstNameOf(profile),
        amount,
        approved: true,
        planName,
      }),
    })
  }

  return json({ ok: true, deposit_id: deposit.id })
})
