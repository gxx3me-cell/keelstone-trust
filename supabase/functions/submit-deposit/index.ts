// submit-deposit
//
// An investor tells us they've sent funds to one of our published addresses.
// Nothing is credited here — this files a PENDING request for an admin to
// confirm (admin-action approves it).
//
// This runs server-side because investors have no INSERT policy on `deposits`:
// a user who could insert their own row could set status='approved' and credit
// themselves any amount. Everything price-related is re-read from the database
// rather than trusted from the request body.
//
// Body: { amount, method_id, plan_id?, reference? }

import {
  corsHeaders, preflight, json, getCaller, adminClient, adminEmails,
  displayName, firstNameOf,
} from '../_shared/auth.ts'
import {
  sendMail, depositRequestedAdminEmail, depositReceivedEmail, money,
} from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight()
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const caller = await getCaller(req)
  if (!caller) return json({ error: 'You must be signed in to make a deposit.' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // ── amount ──
  const amount = Number(String(body.amount ?? '').replace(/,/g, '').trim())
  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: 'Enter a valid deposit amount.' }, 400)
  }
  if (amount > 1e12) return json({ error: 'That amount is not supported.' }, 400)

  const admin = adminClient()

  // ── deposit method: must be one we actually published and still active ──
  const methodId = String(body.method_id ?? '').trim()
  if (!methodId) return json({ error: 'Choose a deposit method.' }, 400)

  const { data: method } = await admin
    .from('deposit_methods')
    .select('*')
    .eq('id', methodId)
    .maybeSingle()

  if (!method || method.active === false) {
    return json({ error: 'That deposit method is no longer available.' }, 400)
  }
  if (Number(method.min_amount ?? 0) > 0 && amount < Number(method.min_amount)) {
    return json({ error: `The minimum ${method.name} deposit is $${money(Number(method.min_amount))}.` }, 400)
  }

  const methodLabel = method.network ? `${method.name} (${method.network})` : method.name

  // ── plan: optional. Omitted means "credit my available balance". ──
  const planId = String(body.plan_id ?? '').trim() || null
  let planName: string | null = null
  let annualReturnPct = 0

  if (planId) {
    const { data: plan } = await admin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle()

    if (!plan || plan.active === false) {
      return json({ error: 'That investment plan is no longer available.' }, 400)
    }

    // Limits are re-read from the DB — never taken from the client.
    const min = Number(plan.min_usd ?? 0)
    const max = Number(plan.max_usd ?? 0)
    if (min && amount < min) return json({ error: `The minimum for ${plan.name} is $${money(min)}.` }, 400)
    if (max && amount > max) return json({ error: `The maximum for ${plan.name} is $${money(max)}.` }, 400)

    planName = plan.name
    annualReturnPct = Number(plan.annual_return_pct ?? 0)
  }

  const reference = String(body.reference ?? '').trim().slice(0, 200)
  const investorName = displayName(caller.profile, caller.email)

  // ── file the request ──
  const { data: deposit, error: insertError } = await admin
    .from('deposits')
    .insert({
      user_id: caller.id,
      amount,
      status: 'pending',            // hard-coded — never from the request
      method_id: method.id,
      method_label: methodLabel,
      wallet_address: method.wallet_address,
      plan_id: planId,
      plan_name: planName,
      annual_return_pct: annualReturnPct,
      reference: reference || null,
      // A reference shaped like an EVM tx hash also goes in tx_hash so the
      // admin table can render it as a block-explorer link.
      tx_hash: /^0x[a-fA-F0-9]{64}$/.test(reference) ? reference : null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('deposit insert failed:', insertError)
    return json({ error: 'Could not submit your deposit request. Please try again.' }, 500)
  }

  // ── notify: admins, then the investor. Never fail the request on email. ──
  const planLabel = planName ?? 'General balance (unallocated)'

  const admins = await adminEmails(admin)
  if (admins.length) {
    await sendMail({
      to: admins,
      subject: `New deposit request — $${money(amount)} from ${investorName}`,
      replyTo: caller.email ?? undefined,
      idempotencyKey: `deposit-admin-${deposit.id}`,
      html: depositRequestedAdminEmail({
        investorName,
        investorEmail: caller.email ?? '—',
        amount,
        methodLabel,
        planLabel,
        reference,
      }),
    })
  } else {
    console.warn('No admin profiles found — deposit request went unannounced.')
  }

  if (caller.email) {
    await sendMail({
      to: caller.email,
      subject: `We’ve received your $${money(amount)} deposit request`,
      idempotencyKey: `deposit-investor-${deposit.id}`,
      html: depositReceivedEmail({
        firstName: firstNameOf(caller.profile),
        amount,
        planLabel,
      }),
    })
  }

  return json({
    ok: true,
    deposit_id: deposit.id,
    status: 'pending',
    message: 'Your deposit request has been submitted and is awaiting confirmation.',
  })
})
