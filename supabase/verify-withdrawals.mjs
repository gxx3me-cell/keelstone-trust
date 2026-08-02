// Verifies the withdrawal flow: balance actually drops on approval, BTC-only
// addresses, and no over-withdrawing.
//
//   source .supabase-secrets.local.sh && node supabase/verify-withdrawals.mjs
//
// Mirrors getMyPortfolio() in src/lib/deposits.js so the numbers asserted here
// are the ones the dashboard renders.

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

const stamp = Date.now()
const PW = 'Test-Passw0rd!' + stamp
const BTC = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'   // valid bech32
const BTC_LEGACY = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'    // genesis address
let investorId, adminId, investorToken, adminToken

const mk = async (email) => {
  const r = await svc('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password: PW, email_confirm: true }),
  })
  if (!r.ok) throw new Error(`create ${email}: ${r.status} ${(await r.text()).slice(0, 140)}`)
  return (await r.json()).id
}

const login = async (email) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  })
  return (await r.json()).access_token
}

const asUser = (token, path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

/** The same arithmetic getMyPortfolio() does, so assertions match the UI. */
async function balances(userId) {
  const [deps, wds] = await Promise.all([
    (await svc(`/rest/v1/deposits?user_id=eq.${userId}&select=*`)).json(),
    (await svc(`/rest/v1/withdrawals?user_id=eq.${userId}&select=*`)).json(),
  ])
  const n = (v) => Number(v || 0)
  const credited = deps
    .filter((d) => d.status === 'approved' && !d.plan_id && !d.allocated)
    .reduce((s, d) => s + n(d.amount), 0)
  const withdrawn = wds.filter((w) => w.status === 'approved').reduce((s, w) => s + n(w.amount), 0)
  const pending = wds.filter((w) => w.status === 'pending').reduce((s, w) => s + n(w.amount), 0)
  // Investments are withdrawable too — an investor whose every deposit went
  // into a plan would otherwise never be able to withdraw anything.
  const invs = await (await svc(`/rest/v1/investments_with_earnings?user_id=eq.${userId}&status=eq.active&select=principal,earnings`)).json()
  const investedValue = invs.reduce((s, i) => s + n(i.principal) + n(i.earnings), 0)

  // A payout comes out of cash first, then out of invested capital. Deducting
  // it from cash alone clamps at zero and makes an approved withdrawal
  // invisible for anyone holding no uninvested cash.
  const fromCash = Math.min(credited, withdrawn)
  const available = Math.max(credited - fromCash, 0)
  const netInvested = Math.max(investedValue - (withdrawn - fromCash), 0)
  const totalValue = Math.max(investedValue + credited - withdrawn, 0)

  return {
    credited, withdrawn, pending, available, investedValue, netInvested,
    totalValue,
    withdrawable: Math.max(totalValue - pending, 0),
  }
}

async function main() {
  console.log('\n0. Fixtures')
  {
    investorId = await mk(`wd-inv-${stamp}@keelstone-test.invalid`)
    adminId = await mk(`wd-adm-${stamp}@keelstone-test.invalid`)
    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })
    investorToken = await login(`wd-inv-${stamp}@keelstone-test.invalid`)
    adminToken = await login(`wd-adm-${stamp}@keelstone-test.invalid`)

    // $10,000 of spendable balance (approved, no plan).
    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: investorId, amount: 10000, status: 'approved', method_label: 'seed', allocated: false }),
    })
    const b = await balances(investorId)
    b.available === 10000 ? pass('investor starts with $10,000 available') : fail(`starting balance is $${b.available}`)
  }

  console.log('\n1. Bitcoin addresses only')
  {
    const bad = [
      ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 'an Ethereum address'],
      ['tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 'a testnet address'],
      ['not-an-address', 'gibberish'],
      ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN0', 'a legacy address with a 0 in it'],
    ]
    for (const [addr, label] of bad) {
      const r = await asUser(investorToken, '/rest/v1/withdrawals', {
        method: 'POST',
        body: JSON.stringify({ user_id: investorId, amount: 100, status: 'pending', bank_details: addr }),
      })
      r.ok ? fail(`${label} was accepted`) : pass(`${label} rejected (${r.status})`)
    }

    for (const [addr, label] of [[BTC, 'bech32'], [BTC_LEGACY, 'legacy']]) {
      const r = await asUser(investorToken, '/rest/v1/withdrawals', {
        method: 'POST', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ user_id: investorId, amount: 100, status: 'pending', bank_details: addr }),
      })
      if (r.ok) {
        pass(`valid ${label} address accepted`)
        const [row] = await r.json()
        await svc(`/rest/v1/withdrawals?id=eq.${row.id}`, { method: 'DELETE' })
      } else {
        fail(`valid ${label} address rejected: ${(await r.text()).slice(0, 120)}`)
      }
    }
  }

  console.log('\n2. Cannot withdraw more than available')
  {
    const r = await asUser(investorToken, '/rest/v1/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ user_id: investorId, amount: 25000, status: 'pending', bank_details: BTC }),
    })
    r.ok ? fail('OVERDRAW: investor requested $25,000 against a $10,000 balance') : pass(`over-withdrawal refused (${r.status})`)
  }

  console.log('\n3. Approval deducts from the balance')
  {
    const before = await balances(investorId)

    const filed = await asUser(investorToken, '/rest/v1/withdrawals', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: investorId, amount: 3000, status: 'pending', bank_details: BTC }),
    })
    if (!filed.ok) { fail(`could not file a withdrawal: ${(await filed.text()).slice(0, 140)}`); return }
    const [wd] = await filed.json()
    pass('investor filed a $3,000 withdrawal')

    const whilePending = await balances(investorId)
    whilePending.available === before.available
      ? pass('available balance unchanged while pending (funds not yet gone)')
      : fail(`available moved to $${whilePending.available} before approval`)
    Math.abs(whilePending.withdrawable - (before.withdrawable - 3000)) < 0.01
      ? pass('withdrawable drops by $3,000 — funds are spoken for')
      : fail(`withdrawable is $${whilePending.withdrawable}, expected $${before.withdrawable - 3000}`)

    // A second request for the remainder-plus-one must fail.
    const greedy = await asUser(investorToken, '/rest/v1/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ user_id: investorId, amount: 7500, status: 'pending', bank_details: BTC }),
    })
    greedy.ok ? fail('DOUBLE-SPEND: second request ignored the pending one') : pass(`cannot double-spend the pending amount (${greedy.status})`)

    // Approve it.
    const appr = await fetch(`${URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'withdrawal', record_id: wd.id, action: 'approve' }),
    })
    appr.ok ? pass('admin approved the withdrawal') : fail(`approval failed: ${appr.status} ${(await appr.text()).slice(0, 140)}`)

    const after = await balances(investorId)
    after.available === before.available - 3000
      ? pass(`available balance dropped $10,000 → $${after.available}`)
      : fail(`BALANCE NOT DEDUCTED: available is $${after.available}, expected $${before.available - 3000}`)
    after.withdrawn === 3000 ? pass('withdrawal counted as paid out') : fail(`withdrawn total is $${after.withdrawn}`)
  }

  console.log('\n4. Rejection returns the funds')
  {
    const before = await balances(investorId)
    const filed = await asUser(investorToken, '/rest/v1/withdrawals', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: investorId, amount: 2000, status: 'pending', bank_details: BTC }),
    })
    const [wd] = await filed.json()

    await fetch(`${URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'withdrawal', record_id: wd.id, action: 'reject', note: 'Test rejection' }),
    })

    const after = await balances(investorId)
    after.available === before.available
      ? pass('rejected withdrawal left the balance untouched')
      : fail(`balance changed on rejection: $${before.available} → $${after.available}`)
    Math.abs(after.withdrawable - before.withdrawable) < 0.01
      ? pass('withdrawable restored after rejection')
      : fail(`withdrawable is $${after.withdrawable}, expected $${before.withdrawable}`)
  }

  console.log('\n5. An all-invested investor can still withdraw')
  {
    // The reported bug: every deposit went into a plan, so uninvested cash was
    // $0 and the withdraw sheet showed "Available to withdraw $0" despite a
    // funded portfolio.
    const id = await mk(`wd-plan-${stamp}@keelstone-test.invalid`)
    const token = await login(`wd-plan-${stamp}@keelstone-test.invalid`)

    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: id, amount: 20000, status: 'approved', plan_name: 'Balanced', allocated: true, method_label: 'seed' }),
    })
    await svc('/rest/v1/investments', {
      method: 'POST',
      body: JSON.stringify({ user_id: id, plan_name: 'Balanced', principal: 20000, annual_return_pct: 15, status: 'active', start_date: new Date().toISOString() }),
    })

    const b = await balances(id)
    b.available === 0 ? pass('uninvested cash is $0, as expected') : fail(`uninvested cash is $${b.available}`)
    b.withdrawable >= 20000
      ? pass(`withdrawable is $${b.withdrawable.toFixed(2)} — invested capital counts`)
      : fail(`REGRESSION: withdrawable is $${b.withdrawable}, expected ~$20,000`)

    const r = await asUser(token, '/rest/v1/withdrawals', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: id, amount: 15000, status: 'pending', bank_details: BTC }),
    })
    r.ok
      ? pass('all-invested investor filed a $15,000 withdrawal')
      : fail(`could not withdraw against investments: ${(await r.text()).slice(0, 140)}`)

    await svc(`/rest/v1/withdrawals?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/investments?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/notifications?actor_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  console.log('\n6. An approved payout reduces an all-invested balance')
  {
    // The reported bug: admin approved a withdrawal but the investor's balance
    // kept showing the original figure. Withdrawals were deducted from
    // uninvested cash only, and cash was $0, so Math.max(0 - payout, 0)
    // clamped to zero and the payout never moved anything.
    const id = await mk(`wd-net-${stamp}@keelstone-test.invalid`)
    const token = await login(`wd-net-${stamp}@keelstone-test.invalid`)

    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: id, amount: 25000, status: 'approved', plan_name: 'Balanced', allocated: true, method_label: 'seed' }),
    })
    await svc('/rest/v1/investments', {
      method: 'POST',
      body: JSON.stringify({ user_id: id, plan_name: 'Balanced', principal: 25000, annual_return_pct: 15, status: 'active', start_date: new Date().toISOString() }),
    })

    const before = await balances(id)
    Math.abs(before.totalValue - 25000) < 1
      ? pass(`starts at $${before.totalValue.toFixed(2)} with no uninvested cash`)
      : fail(`starting total is $${before.totalValue}`)

    const filed = await asUser(token, '/rest/v1/withdrawals', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: id, amount: 5000, status: 'pending', bank_details: BTC }),
    })
    const [wd] = await filed.json()

    await fetch(`${URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'withdrawal', record_id: wd.id, action: 'approve' }),
    })

    const after = await balances(id)
    Math.abs(after.totalValue - (before.totalValue - 5000)) < 1
      ? pass(`balance dropped to $${after.totalValue.toFixed(2)} after the $5,000 payout`)
      : fail(`STALE BALANCE: total is $${after.totalValue.toFixed(2)}, expected ~$${(before.totalValue - 5000).toFixed(2)}`)

    Math.abs(after.netInvested - (before.investedValue - 5000)) < 1
      ? pass('invested value reflects the payout drawn against the plan')
      : fail(`invested value is $${after.netInvested.toFixed(2)}, expected ~$${(before.investedValue - 5000).toFixed(2)}`)

    // The dashboard figure must agree with what the database will allow next.
    const db = Number(await (await svc('/rest/v1/rpc/withdrawable_balance', {
      method: 'POST', body: JSON.stringify({ p_user_id: id }),
    })).text())
    Math.abs(after.withdrawable - db) < 0.02
      ? pass(`client and database agree on withdrawable ($${db.toFixed(2)})`)
      : fail(`DRIFT: client says $${after.withdrawable.toFixed(2)}, database says $${db.toFixed(2)}`)

    await svc(`/rest/v1/withdrawals?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/investments?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/notifications?actor_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
}

try {
  await main()
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  for (const id of [investorId, adminId].filter(Boolean)) {
    await svc(`/rest/v1/withdrawals?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/notifications?actor_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
  console.log('  removed test users and records')
}

console.log(failures === 0 ? '\n\x1b[32mAll withdrawal checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exitCode = failures === 0 ? 0 : 1
