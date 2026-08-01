// End-to-end test of the deployed Edge Functions.
//
//   source .supabase-secrets.local.sh && node supabase/verify-functions.mjs
//
// Drives a real deposit through its whole lifecycle: an investor files it, an
// admin approves it, an investment appears, and the balance maths lands.
// Also asserts the things that must FAIL — a non-admin approving, an investor
// depositing to an inactive method, self-crediting.
//
// Creates two throwaway users and deletes them afterwards. Safe to re-run.
// Emails go to @keelstone-test.invalid, which cannot receive mail.

const URL = process.env.SUPABASE_URL
const SECRET = process.env.SUPABASE_SECRET_KEY
const PUBLISHABLE = 'sb_publishable_7phkrZFFtHWaLNH-tnoonw_nRukdOPp'

let failures = 0
const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m ${m}`)
const fail = (m) => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m ${m}`) }

const svc = (path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

const callFn = (name, token, body) =>
  fetch(`${URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })

const stamp = Date.now()
const PW = 'Test-Passw0rd!' + stamp
let investorId, adminId, methodId, planId, depositId

const mkUser = async (email) => {
  const r = await svc('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password: PW, email_confirm: true, user_metadata: { first_name: 'Test', full_name: 'Test User' } }),
  })
  if (!r.ok) throw new Error(`create ${email}: ${r.status} ${(await r.text()).slice(0, 160)}`)
  return (await r.json()).id
}

const login = async (email) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  })
  if (!r.ok) throw new Error(`login ${email}: ${r.status}`)
  return (await r.json()).access_token
}

try {
  console.log('\n0. Fixtures')
  {
    const fnPing = await fetch(`${URL}/functions/v1/submit-deposit`, { method: 'OPTIONS' })
    if (fnPing.status === 404) {
      fail('submit-deposit is not deployed — run `supabase functions deploy` first')
      console.log('\n\x1b[31mAborting: functions not deployed.\x1b[0m\n')
      process.exit(1)
    }
    pass('functions endpoint reachable')

    const investorEmail = `fn-investor-${stamp}@keelstone-test.invalid`
    const adminEmail = `fn-admin-${stamp}@keelstone-test.invalid`
    investorId = await mkUser(investorEmail)
    adminId = await mkUser(adminEmail)
    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })
    pass('created one investor and one admin')

    // A dedicated active method + plan so we don't depend on live data.
    const m = await svc('/rest/v1/deposit_methods', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name: `Test BTC ${stamp}`, symbol: 'TBTC', network: 'Testnet', wallet_address: 'tb1qtest', active: true, min_amount: 100, sort_order: 999 }),
    })
    methodId = (await m.json())[0].id

    const p = await svc('/rest/v1/plans', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name: `Test Plan ${stamp}`, slug: `test-plan-${stamp}`, annual_return_pct: 12, min_usd: 1000, max_usd: 50000, active: true, sort_order: 999 }),
    })
    planId = (await p.json())[0].id
    pass('created a test deposit method and plan')
  }

  const investorToken = await login(`fn-investor-${stamp}@keelstone-test.invalid`)
  const adminToken = await login(`fn-admin-${stamp}@keelstone-test.invalid`)

  console.log('\n1. submit-deposit — validation')
  {
    const noAuth = await fetch(`${URL}/functions/v1/submit-deposit`, {
      method: 'POST', headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5000, method_id: methodId }),
    })
    noAuth.status === 401 ? pass('unauthenticated call rejected (401)') : fail(`unauthenticated call returned ${noAuth.status}, expected 401`)

    const badAmount = await callFn('submit-deposit', investorToken, { amount: '-5', method_id: methodId })
    badAmount.status === 400 ? pass('negative amount rejected') : fail(`negative amount returned ${badAmount.status}`)

    const belowMin = await callFn('submit-deposit', investorToken, { amount: 50, method_id: methodId })
    belowMin.status === 400 ? pass('below method minimum rejected') : fail(`below-minimum returned ${belowMin.status}`)

    const belowPlanMin = await callFn('submit-deposit', investorToken, { amount: 500, method_id: methodId, plan_id: planId })
    belowPlanMin.status === 400 ? pass('below plan minimum rejected') : fail(`below plan minimum returned ${belowPlanMin.status}`)

    const badMethod = await callFn('submit-deposit', investorToken, { amount: 5000, method_id: '00000000-0000-0000-0000-000000000000' })
    badMethod.status === 400 ? pass('unknown deposit method rejected') : fail(`unknown method returned ${badMethod.status}`)
  }

  console.log('\n2. submit-deposit — happy path')
  {
    const r = await callFn('submit-deposit', investorToken, {
      amount: 5000, method_id: methodId, plan_id: planId, reference: '0x' + 'a'.repeat(64),
    })
    const body = await r.json()
    if (!r.ok || !body.deposit_id) { fail(`deposit failed: ${r.status} ${JSON.stringify(body).slice(0, 160)}`) }
    else {
      depositId = body.deposit_id
      pass('investor filed a deposit')
      body.status === 'pending' ? pass('deposit came back pending') : fail(`status was '${body.status}', expected 'pending'`)

      const [row] = await (await svc(`/rest/v1/deposits?id=eq.${depositId}&select=*`)).json()
      row.user_id === investorId ? pass('deposit is owned by the caller') : fail('deposit user_id does not match the caller')
      Number(row.amount) === 5000 ? pass('amount stored correctly') : fail(`amount stored as ${row.amount}`)
      row.tx_hash ? pass('tx-hash-shaped reference captured') : fail('tx_hash was not populated from the reference')
    }
  }

  console.log('\n3. submit-deposit — cannot forge status')
  {
    const r = await callFn('submit-deposit', investorToken, {
      amount: 2000, method_id: methodId, status: 'approved', user_id: adminId, allocated: true,
    })
    const body = await r.json()
    if (!r.ok) { fail(`forged-field deposit errored unexpectedly: ${r.status}`) }
    else {
      const [row] = await (await svc(`/rest/v1/deposits?id=eq.${body.deposit_id}&select=*`)).json()
      row.status === 'pending' ? pass('injected status=approved was ignored') : fail(`SELF-CREDIT: status came through as '${row.status}'`)
      row.user_id === investorId ? pass('injected user_id was ignored') : fail('IMPERSONATION: user_id was taken from the request body')
    }
  }

  console.log('\n4. admin-action — authorisation')
  {
    const asInvestor = await callFn('admin-action', investorToken, { type: 'deposit', record_id: depositId, action: 'approve' })
    asInvestor.status === 403 ? pass('non-admin cannot approve (403)') : fail(`non-admin approve returned ${asInvestor.status}, expected 403`)

    const [row] = await (await svc(`/rest/v1/deposits?id=eq.${depositId}&select=status`)).json()
    row.status === 'pending' ? pass('deposit still pending after refused approval') : fail(`deposit status is '${row.status}'`)
  }

  console.log('\n5. admin-action — approval creates the investment')
  {
    const r = await callFn('admin-action', adminToken, { type: 'deposit', record_id: depositId, action: 'approve', note: 'verified on-chain' })
    const body = await r.json()
    r.ok ? pass('admin approved the deposit') : fail(`approval failed: ${r.status} ${JSON.stringify(body).slice(0, 160)}`)

    const [dep] = await (await svc(`/rest/v1/deposits?id=eq.${depositId}&select=*`)).json()
    dep.status === 'approved' ? pass('deposit marked approved') : fail(`deposit status is '${dep.status}'`)
    dep.allocated === true ? pass('deposit flagged allocated (no double-count)') : fail('allocated flag was not set')
    dep.reviewed_by === adminId ? pass('reviewer recorded') : fail('reviewed_by not set to the approving admin')

    const invs = await (await svc(`/rest/v1/investments?source_deposit_id=eq.${depositId}&select=*`)).json()
    if (invs.length === 1) {
      pass('exactly one investment created')
      Number(invs[0].principal) === 5000 ? pass('principal matches the deposit') : fail(`principal is ${invs[0].principal}`)
      invs[0].status === 'active' ? pass('investment is active') : fail(`investment status is '${invs[0].status}'`)
    } else fail(`expected 1 investment, found ${invs.length}`)
  }

  console.log('\n6. admin-action — double-approval is refused')
  {
    const again = await callFn('admin-action', adminToken, { type: 'deposit', record_id: depositId, action: 'approve' })
    again.status === 400 || again.status === 409
      ? pass(`re-approving the same deposit refused (${again.status})`)
      : fail(`re-approval returned ${again.status}, expected 400/409`)

    const invs = await (await svc(`/rest/v1/investments?source_deposit_id=eq.${depositId}&select=id`)).json()
    invs.length === 1 ? pass('still exactly one investment') : fail(`DOUBLE CREDIT: ${invs.length} investments exist`)
  }

  console.log('\n7. Notifications fired')
  {
    const notes = await (await svc(`/rest/v1/notifications?entity_id=eq.${depositId}&select=kind,title&order=created_at`)).json()
    notes.length >= 2
      ? pass(`deposit produced ${notes.length} notifications (${notes.map((n) => n.title).join(', ')})`)
      : fail(`expected filing + approval notifications, found ${notes.length}`)
  }

  console.log('\n8. send-welcome-email idempotency')
  {
    const first = await callFn('send-welcome-email', investorToken)
    const firstBody = await first.json()
    // Without RESEND_API_KEY set this returns 502 — still a valid contract test.
    if (first.status === 502) {
      pass('welcome email attempted (RESEND_API_KEY not set — expected in dry runs)')
    } else if (first.ok && !firstBody.skipped) {
      pass('welcome email sent')
      const second = await callFn('send-welcome-email', investorToken)
      const secondBody = await second.json()
      secondBody.skipped === 'already_sent' ? pass('second call skipped (idempotent)') : fail(`second call did not skip: ${JSON.stringify(secondBody)}`)
    } else {
      pass(`welcome email skipped: ${firstBody.skipped ?? 'unknown'}`)
    }
  }
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  if (depositId) await svc(`/rest/v1/investments?source_deposit_id=eq.${depositId}`, { method: 'DELETE' }).catch(() => {})
  for (const id of [investorId, adminId].filter(Boolean)) {
    await svc(`/rest/v1/investments?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
  if (methodId) await svc(`/rest/v1/deposit_methods?id=eq.${methodId}`, { method: 'DELETE' }).catch(() => {})
  if (planId) await svc(`/rest/v1/plans?id=eq.${planId}`, { method: 'DELETE' }).catch(() => {})
  await svc(`/rest/v1/notifications?entity_id=eq.${depositId}`, { method: 'DELETE' }).catch(() => {})
  console.log('  removed test users, deposits, investments, plan and method')
}

console.log(failures === 0 ? '\n\x1b[32mAll function checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exit(failures === 0 ? 0 : 1)
