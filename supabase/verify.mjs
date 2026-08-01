// Post-migration verification.
//
//   source .supabase-secrets.local.sh && node supabase/verify.mjs
//
// Checks that the schema exists and — more importantly — that RLS actually
// isolates users. A misconfigured policy fails silently, so this asserts the
// negative case: a signed-in investor must NOT see anyone else's rows.

const URL = process.env.SUPABASE_URL
const SECRET = process.env.SUPABASE_SECRET_KEY
const PUBLISHABLE = 'sb_publishable_7phkrZFFtHWaLNH-tnoonw_nRukdOPp'

if (!URL || !SECRET) {
  console.error('Missing env. Run: source .supabase-secrets.local.sh')
  process.exit(1)
}

const TABLES = ['profiles', 'plans', 'deposit_methods', 'deposits', 'investments', 'withdrawals', 'messages']

let failures = 0
const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m ${m}`)
const fail = (m) => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m ${m}`) }

const svc = (path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

console.log('\n1. Schema')
for (const t of TABLES) {
  const r = await svc(`/rest/v1/${t}?limit=1`)
  r.ok ? pass(`${t} exists`) : fail(`${t} — ${r.status} ${(await r.text()).slice(0, 80)}`)
}

console.log('\n2. RLS enabled on every table')
{
  // pg_class.relrowsecurity via PostgREST isn't reachable, so infer instead:
  // with RLS on and no anon policy, an anon read of a protected table returns [].
  const anonRead = await fetch(`${URL}/rest/v1/deposits?limit=1`, {
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` },
  })
  const body = await anonRead.text()
  if (anonRead.status === 200 && body.trim() === '[]') pass('anon cannot read deposits')
  else if (anonRead.status === 401 || anonRead.status === 403) pass(`anon blocked from deposits (${anonRead.status})`)
  else fail(`anon read of deposits returned ${anonRead.status} ${body.slice(0, 120)} — RLS may be OFF`)

  const anonPlans = await fetch(`${URL}/rest/v1/plans?limit=1`, {
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` },
  })
  anonPlans.ok ? pass('anon can read plans (intended — public landing page)')
               : fail(`anon cannot read plans (${anonPlans.status}) — landing page will be empty`)
}

console.log('\n3. Cross-user isolation (the one that matters)')
{
  const stamp = Date.now()
  const mk = async (email) => {
    const r = await svc('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'Test-Passw0rd!' + stamp, email_confirm: true }),
    })
    if (!r.ok) throw new Error(`create ${email}: ${r.status} ${(await r.text()).slice(0, 160)}`)
    return (await r.json()).id
  }

  let alice, bob
  try {
    alice = await mk(`rls-alice-${stamp}@keelstone-test.invalid`)
    bob = await mk(`rls-bob-${stamp}@keelstone-test.invalid`)
    pass('created two test users')

    // Seed a deposit owned by Bob, using the secret key (bypasses RLS).
    const seed = await svc('/rest/v1/deposits', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: bob, amount: 4242.42, status: 'pending', method_label: 'RLS probe' }),
    })
    if (!seed.ok) throw new Error(`seed deposit: ${seed.status} ${(await seed.text()).slice(0, 160)}`)
    pass("seeded a deposit owned by Bob")

    // Sign in as Alice and try to read it.
    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `rls-alice-${stamp}@keelstone-test.invalid`, password: 'Test-Passw0rd!' + stamp }),
    })
    if (!login.ok) throw new Error(`login: ${login.status} ${(await login.text()).slice(0, 160)}`)
    const { access_token } = await login.json()
    pass('signed in as Alice')

    const asAlice = (path) =>
      fetch(`${URL}${path}`, { headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}` } })

    const seen = await (await asAlice('/rest/v1/deposits?select=*')).json()
    if (Array.isArray(seen) && seen.length === 0) pass("Alice sees 0 deposits — Bob's row is hidden")
    else fail(`Alice sees ${seen.length ?? '?'} deposit(s) — DATA LEAK: ${JSON.stringify(seen).slice(0, 160)}`)

    const profs = await (await asAlice('/rest/v1/profiles?select=id,email')).json()
    if (Array.isArray(profs) && profs.length === 1 && profs[0].id === alice) pass('Alice sees only her own profile')
    else fail(`Alice sees ${profs.length ?? '?'} profile(s) — expected exactly 1: ${JSON.stringify(profs).slice(0, 160)}`)

    // Privilege escalation must be refused.
    const esc = await fetch(`${URL}/rest/v1/profiles?id=eq.${alice}`, {
      method: 'PATCH',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ role: 'admin' }),
    })
    const escBody = await esc.text()
    const after = await (await svc(`/rest/v1/profiles?id=eq.${alice}&select=role`)).json()
    if (after[0]?.role === 'admin') fail('PRIVILEGE ESCALATION: Alice made herself an admin')
    else pass(`self-promotion to admin refused (${esc.status})`)

    // Investors must not be able to file their own deposits.
    const ins = await fetch(`${URL}/rest/v1/deposits`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: alice, amount: 999999, status: 'approved' }),
    })
    if (ins.ok) fail('SELF-CREDIT: Alice inserted her own approved deposit')
    else pass(`investor cannot insert a deposit (${ins.status})`)
  } catch (e) {
    fail(e.message)
  } finally {
    for (const id of [alice, bob].filter(Boolean)) {
      await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
    }
    await svc(`/rest/v1/deposits?method_label=eq.RLS%20probe`, { method: 'DELETE' }).catch(() => {})
    console.log('  cleaned up test users and rows')
  }
}

console.log(failures === 0 ? '\n\x1b[32mAll checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exit(failures === 0 ? 0 : 1)
