// admin-action
//
// Approve or reject a pending deposit or withdrawal.
//
// Approving a DEPOSIT is what actually credits an investor:
//   - named a plan  → an active investment is created and starts earning
//   - named no plan → it becomes spendable balance
//
// Approving a WITHDRAWAL only records that it was paid — funds are sent by hand.
//
// The status transition is guarded: the update only matches rows still
// 'pending', so two admins clicking approve at the same time can't create two
// investments from one deposit.
//
// Body: { type: 'deposit'|'withdrawal', record_id, action: 'approve'|'reject', note? }

import {
  preflight, json, getCaller, adminClient, firstNameOf,
} from '../_shared/auth.ts'
import {
  sendMail, depositReviewedEmail, withdrawalReviewedEmail, money,
} from '../_shared/email.ts'

const TABLE = { deposit: 'deposits', withdrawal: 'withdrawals' } as const

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

  const type = String(body.type ?? '') as keyof typeof TABLE
  const recordId = String(body.record_id ?? '').trim()
  const action = String(body.action ?? '')
  const note = String(body.note ?? '').trim().slice(0, 500)

  const table = TABLE[type]
  if (!table) return json({ error: 'Unknown record type.' }, 400)
  if (!recordId) return json({ error: 'Missing record id.' }, 400)
  if (action !== 'approve' && action !== 'reject') {
    return json({ error: 'Action must be approve or reject.' }, 400)
  }

  const admin = adminClient()

  const { data: record } = await admin.from(table).select('*').eq('id', recordId).maybeSingle()
  if (!record) return json({ error: 'That request no longer exists.' }, 404)
  if (record.status !== 'pending') {
    return json({ error: `This request was already ${record.status}.` }, 400)
  }

  const amount = Number(record.amount ?? 0)
  const approved = action === 'approve'
  const now = new Date().toISOString()

  // Claim the record first. `.eq('status','pending')` makes this a compare-and-
  // set: if another admin got here first, zero rows come back and we stop
  // before creating any investment.
  const { data: claimed, error: claimError } = await admin
    .from(table)
    .update({
      status: approved ? 'approved' : 'rejected',
      admin_note: note || null,
      reviewed_by: caller.id,
      reviewed_at: now,
    })
    .eq('id', recordId)
    .eq('status', 'pending')
    .select()

  if (claimError) {
    console.error('claim failed:', claimError)
    return json({ error: 'Could not update the request.' }, 500)
  }
  if (!claimed || claimed.length === 0) {
    return json({ error: 'That request was just handled by someone else.' }, 409)
  }

  // ── An approved deposit naming a plan opens the investment ──
  if (type === 'deposit' && approved && record.plan_id) {
    const { error: invError } = await admin.from('investments').insert({
      user_id: record.user_id,
      plan_id: record.plan_id,
      plan_name: record.plan_name,
      principal: amount,
      annual_return_pct: Number(record.annual_return_pct ?? 0),
      status: 'active',
      start_date: now,
      source_deposit_id: record.id,
    })

    if (invError) {
      // Roll the deposit back to pending so it can be retried — otherwise the
      // investor is marked credited with nothing to show for it.
      console.error('investment insert failed, reverting deposit:', invError)
      await admin
        .from('deposits')
        .update({ status: 'pending', reviewed_by: null, reviewed_at: null, admin_note: null })
        .eq('id', recordId)
      return json({ error: 'Could not open the investment. The deposit was left pending — please try again.' }, 500)
    }

    // Flag it so the available-balance sum doesn't count it twice.
    await admin.from('deposits').update({ allocated: true }).eq('id', recordId)
  }

  // ── tell the investor ──
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', record.user_id)
    .maybeSingle()

  const to = profile?.email
  if (to) {
    const firstName = firstNameOf(profile)
    if (type === 'deposit') {
      await sendMail({
        to,
        subject: approved
          ? `Your $${money(amount)} deposit is confirmed`
          : `About your $${money(amount)} deposit request`,
        idempotencyKey: `deposit-reviewed-${recordId}-${approved}`,
        html: depositReviewedEmail({ firstName, amount, approved, planName: record.plan_name, note }),
      })
    } else {
      await sendMail({
        to,
        subject: approved
          ? `Your $${money(amount)} withdrawal has been approved`
          : `About your $${money(amount)} withdrawal request`,
        idempotencyKey: `withdrawal-reviewed-${recordId}-${approved}`,
        html: withdrawalReviewedEmail({
          firstName, amount, approved, note,
          address: record.bank_details ?? null,
        }),
      })
    }
  }

  return json({ ok: true, status: approved ? 'approved' : 'rejected' })
})
