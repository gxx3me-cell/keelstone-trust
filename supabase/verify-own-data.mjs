// Verifies that "my" queries return MY data — including when the caller is an
// admin, who can legitimately read everyone's rows.
//
//   source .supabase-secrets.local.sh && node supabase/verify-own-data.mjs
//
// This is the regression guard for a live bug: getMyPortfolio() leaned on RLS
// to scope its reads, but admins hold policies granting them every row. An
// admin opening /dashboard therefore saw the sum of ALL investors' deposits
// and investments presented as their own balance.
//
// RLS was never broken — investors were always isolated. The fault was reading
// without an explicit user filter, so the fix is client-side and this test
// mirrors exactly what src/lib does.

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
let adminId, richId, poorId

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

/** Exactly what getMyPortfolio() does in src/lib/deposits.js. */
async function portfolioAsSeenBy(token, userId) {
  const H = { apikey: PUBLISHABLE, Authorization: `Bearer ${token}` }
  const q = (t, extra = '') =>
    fetch(`${URL}/rest/v1/${t}?select=*&user_id=eq.${userId}${extra}`, { headers: H }).then((r) => r.json())

  const [invs, deps, wds] = await Promise.all([
    q('investments_with_earnings', '&status=eq.active'),
    q('deposits'),
    q('withdrawals'),
  ])
  const n = (v) => Number(v || 0)
  const principal = invs.reduce((s, i) => s + n(i.principal), 0)
  const earnings = invs.reduce((s, i) => s + n(i.earnings), 0)
  const credited = deps
    .filter((d) => d.status === 'approved' && !d.plan_id && !d.allocated)
    .reduce((s, d) => s + n(d.amount), 0)
  const withdrawn = wds.filter((w) => w.status === 'approved').reduce((s, w) => s + n(w.amount), 0)
  const available = Math.max(credited - withdrawn, 0)
  return {
    deposits: deps.length,
    investments: invs.length,
    available,
    total_value: principal + earnings + available,
  }
}

async function main() {
  console.log('\n0. Fixtures')
  {
    adminId = await mk(`own-adm-${stamp}@keelstone-test.invalid`)
    richId = await mk(`own-rich-${stamp}@keelstone-test.invalid`)
    poorId = await mk(`own-poor-${stamp}@keelstone-test.invalid`)
    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })

    // Rich investor: $90k balance + a $40k investment. Poor: $250. Admin: nothing.
    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: richId, amount: 90000, status: 'approved', method_label: 'rich', allocated: false }),
    })
    await svc('/rest/v1/investments', {
      method: 'POST',
      body: JSON.stringify({ user_id: richId, plan_name: 'Growth', principal: 40000, annual_return_pct: 22, status: 'active', start_date: new Date().toISOString() }),
    })
    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: poorId, amount: 250, status: 'approved', method_label: 'poor', allocated: false }),
    })
    pass('admin (owns nothing), rich investor ($130k), poor investor ($250)')
  }

  console.log('\n1. An admin’s own dashboard shows only their own money')
  {
    const token = await login(`own-adm-${stamp}@keelstone-test.invalid`)
    const p = await portfolioAsSeenBy(token, adminId)

    p.deposits === 0
      ? pass('admin sees 0 deposits of their own')
      : fail(`admin's dashboard lists ${p.deposits} deposit(s) — other people's money`)
    p.investments === 0
      ? pass('admin sees 0 investments of their own')
      : fail(`admin's dashboard lists ${p.investments} investment(s)`)
    p.total_value === 0
      ? pass('admin total value is $0')
      : fail(`LEAK: admin's balance reads $${p.total_value} — this is the aggregate of all investors`)

    // And confirm the admin CAN still see everything when they ask for it,
    // because the console depends on that.
    const all = await fetch(`${URL}/rest/v1/deposits?select=id`, {
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
    all.length >= 2
      ? pass(`admin console still sees all deposits (${all.length}) — RLS unchanged`)
      : fail(`admin can only see ${all.length} deposits; the console will be empty`)
  }

  console.log('\n2. Investors see their own figures, not each other’s')
  {
    const richToken = await login(`own-rich-${stamp}@keelstone-test.invalid`)
    const poorToken = await login(`own-poor-${stamp}@keelstone-test.invalid`)

    const rich = await portfolioAsSeenBy(richToken, richId)
    rich.available === 90000
      ? pass('rich investor sees their $90,000 balance')
      : fail(`rich investor's balance is $${rich.available}, expected $90,000`)
    rich.investments === 1 ? pass('rich investor sees their 1 investment') : fail(`sees ${rich.investments} investments`)

    const poor = await portfolioAsSeenBy(poorToken, poorId)
    poor.available === 250
      ? pass('poor investor sees exactly $250 — not the rich investor’s balance')
      : fail(`LEAK: poor investor's balance is $${poor.available}, expected $250`)
    poor.investments === 0 ? pass('poor investor sees 0 investments') : fail(`sees ${poor.investments} investments`)
  }

  console.log('\n3. KYC and newsletter “my” lookups')
  {
    const token = await login(`own-adm-${stamp}@keelstone-test.invalid`)
    const H = { apikey: PUBLISHABLE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // Give the rich investor a KYC submission and a subscription.
    await svc('/rest/v1/kyc_submissions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: richId, status: 'submitted', full_name: 'Rich Investor',
        date_of_birth: '1980-01-01', country: 'UK', address: '1 Test St',
        id_type: 'passport', id_number: 'P1234567',
      }),
    })
    await svc('/rest/v1/newsletter_subscribers', {
      method: 'POST',
      body: JSON.stringify({ email: `own-rich-${stamp}@keelstone-test.invalid`, user_id: richId, status: 'subscribed', source: 'landing' }),
    })

    // getMyKycSubmission() — scoped to the caller.
    const kyc = await fetch(`${URL}/rest/v1/kyc_submissions?select=*&user_id=eq.${adminId}&order=submitted_at.desc&limit=1`, { headers: H }).then((r) => r.json())
    kyc.length === 0
      ? pass('admin’s KYC panel shows nothing of their own')
      : fail(`LEAK: admin's KYC panel shows a submission for ${kyc[0]?.full_name}`)

    // getMySubscription() — scoped to the caller.
    const sub = await fetch(`${URL}/rest/v1/newsletter_subscribers?select=status&user_id=eq.${adminId}`, { headers: H }).then((r) => r.json())
    sub.length === 0
      ? pass('admin’s newsletter toggle reflects their own state')
      : fail(`LEAK: admin's subscription lookup returned ${sub.length} row(s)`)

    // The unscoped version — what the code did before — would have leaked.
    const unscoped = await fetch(`${URL}/rest/v1/kyc_submissions?select=full_name&order=submitted_at.desc&limit=1`, { headers: H }).then((r) => r.json())
    unscoped.length > 0
      ? pass(`(confirmed the hazard: an unscoped read returns "${unscoped[0].full_name}" to the admin)`)
      : pass('(no other submissions present to leak)')
  }
}

try {
  await main()
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  for (const id of [adminId, richId, poorId].filter(Boolean)) {
    await svc(`/rest/v1/kyc_submissions?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/newsletter_subscribers?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/investments?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/notifications?actor_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
  console.log('  removed test users and records')
}

console.log(failures === 0 ? '\n\x1b[32mAll own-data checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exitCode = failures === 0 ? 0 : 1
