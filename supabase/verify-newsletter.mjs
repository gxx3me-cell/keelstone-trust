// Verifies the Investor Letter subscription flow.
//
//   source .supabase-secrets.local.sh && node supabase/verify-newsletter.mjs
//
// The important assertion is that the list is WRITE-ONLY to the public: anyone
// may subscribe, but nobody without admin can read it back. A public newsletter
// form that also leaks its subscriber list is a data breach, not a feature.

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

const anon = (path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

const stamp = Date.now()
const visitorEmail = `visitor-${stamp}@keelstone-test.invalid`
const investorEmail = `nl-investor-${stamp}@keelstone-test.invalid`
const PW = 'Test-Passw0rd!' + stamp
let investorId

async function main() {
  console.log('\n1. Anonymous subscribe from the landing page')
  {
    const r = await anon('/rest/v1/rpc/subscribe_to_newsletter', {
      method: 'POST',
      body: JSON.stringify({ p_email: visitorEmail, p_source: 'landing' }),
    })
    r.ok ? pass('logged-out visitor subscribed') : fail(`subscribe failed: ${r.status} ${(await r.text()).slice(0, 160)}`)

    const [row] = await (await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(visitorEmail)}&select=*`)).json()
    row?.status === 'subscribed' ? pass('row stored as subscribed') : fail(`row status is '${row?.status}'`)
    row?.source === 'landing' ? pass('source recorded as landing') : fail(`source is '${row?.source}'`)
  }

  console.log('\n2. Subscribing twice is not an error')
  {
    const again = await anon('/rest/v1/rpc/subscribe_to_newsletter', {
      method: 'POST',
      body: JSON.stringify({ p_email: visitorEmail.toUpperCase(), p_source: 'landing' }),
    })
    again.ok ? pass('re-subscribing (different case) succeeded quietly') : fail(`duplicate subscribe errored: ${again.status}`)

    const rows = await (await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(visitorEmail)}&select=id`)).json()
    rows.length === 1 ? pass('still exactly one row (case-insensitive unique)') : fail(`${rows.length} rows for the same address`)
  }

  console.log('\n3. Invalid addresses are refused')
  {
    const bad = await anon('/rest/v1/rpc/subscribe_to_newsletter', {
      method: 'POST',
      body: JSON.stringify({ p_email: 'not-an-email', p_source: 'landing' }),
    })
    bad.ok ? fail('an invalid address was accepted') : pass(`invalid address refused (${bad.status})`)
  }

  console.log('\n4. The list is write-only to the public')
  {
    const leak = await anon('/rest/v1/newsletter_subscribers?select=email')
    const body = await leak.json()
    const leaked = Array.isArray(body) ? body.length : -1
    leaked === 0
      ? pass('anonymous read returns nothing')
      : fail(`DATA LEAK: anonymous read returned ${leaked} subscriber(s)`)
  }

  console.log('\n5. Signup adopts an earlier subscription')
  {
    // Subscribe first, then create the account with the same address.
    await anon('/rest/v1/rpc/subscribe_to_newsletter', {
      method: 'POST',
      body: JSON.stringify({ p_email: investorEmail, p_source: 'landing' }),
    })

    const c = await svc('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: investorEmail, password: PW, email_confirm: true, user_metadata: { full_name: 'NL Investor' } }),
    })
    investorId = (await c.json()).id
    await new Promise((r) => setTimeout(r, 800))

    const [row] = await (await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(investorEmail)}&select=user_id`)).json()
    row?.user_id === investorId
      ? pass('signup linked the pre-existing subscription to the account')
      : fail(`user_id is ${row?.user_id ?? 'null'}, expected ${investorId}`)
  }

  console.log('\n6. Investor sees only their own row')
  {
    const lg = await anon('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: investorEmail, password: PW }),
    })
    const { access_token } = await lg.json()
    const mine = await fetch(`${URL}/rest/v1/newsletter_subscribers?select=email`, {
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}` },
    })
    const rows = await mine.json()
    rows.length === 1 && rows[0].email === investorEmail
      ? pass('investor sees exactly their own subscription')
      : fail(`investor saw ${rows.length} row(s): ${JSON.stringify(rows).slice(0, 140)}`)

    // Unsubscribe via the RPC, as the dashboard toggle does.
    const un = await fetch(`${URL}/rest/v1/rpc/unsubscribe_from_newsletter`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    un.ok ? pass('investor unsubscribed') : fail(`unsubscribe failed: ${un.status}`)

    const [after] = await (await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(investorEmail)}&select=status,unsubscribed_at`)).json()
    after?.status === 'unsubscribed' && after.unsubscribed_at
      ? pass('status flipped to unsubscribed with a timestamp')
      : fail(`status is '${after?.status}'`)

    // Re-subscribing must reactivate rather than duplicate.
    await fetch(`${URL}/rest/v1/rpc/subscribe_to_newsletter`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_email: investorEmail, p_source: 'dashboard' }),
    })
    const [back] = await (await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(investorEmail)}&select=status,unsubscribed_at`)).json()
    back?.status === 'subscribed' && !back.unsubscribed_at
      ? pass('re-subscribing reactivated the same row')
      : fail(`after re-subscribe status is '${back?.status}'`)
  }

  return failures
}

try {
  await main()
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(visitorEmail)}`, { method: 'DELETE' }).catch(() => {})
  await svc(`/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(investorEmail)}`, { method: 'DELETE' }).catch(() => {})
  if (investorId) {
    await svc(`/rest/v1/notifications?actor_id=eq.${investorId}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${investorId}`, { method: 'DELETE' }).catch(() => {})
  }
  console.log('  removed test subscribers and user')
}

console.log(failures === 0 ? '\n\x1b[32mAll newsletter checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exitCode = failures === 0 ? 0 : 1
