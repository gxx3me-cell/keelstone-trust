// Verifies admin record management: editing, deleting, audit trail, and the
// guardrails that stop an admin locking everyone out or deleting a colleague.
//
//   source .supabase-secrets.local.sh && node supabase/verify-admin-crud.mjs

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
let adminId, admin2Id, investorId, depositId
let adminToken, investorToken

const mk = async (email, name) => {
  const r = await svc('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password: PW, email_confirm: true, user_metadata: { full_name: name } }),
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
  return (await r.json()).access_token
}

const asUser = (token, path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })

const callFn = (token, name, body) =>
  fetch(`${URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

async function main() {
  console.log('\n0. Fixtures')
  {
    const adminEmail = `crud-admin-${stamp}@keelstone-test.invalid`
    const admin2Email = `crud-admin2-${stamp}@keelstone-test.invalid`
    const investorEmail = `crud-inv-${stamp}@keelstone-test.invalid`

    adminId = await mk(adminEmail, 'CRUD Admin')
    admin2Id = await mk(admin2Email, 'Second Admin')
    investorId = await mk(investorEmail, 'CRUD Investor')

    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })
    await svc(`/rest/v1/profiles?id=eq.${admin2Id}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })

    adminToken = await login(adminEmail)
    investorToken = await login(investorEmail)
    pass('created two admins and one investor')

    const d = await svc('/rest/v1/deposits', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: investorId, amount: 1000, status: 'pending', method_label: 'CRUD probe' }),
    })
    depositId = (await d.json())[0].id
    pass('seeded a deposit to edit')
  }

  console.log('\n1. Admin can edit a record')
  {
    const r = await asUser(adminToken, `/rest/v1/deposits?id=eq.${depositId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ amount: 2500, admin_note: 'corrected' }),
    })
    const rows = await r.json()
    Number(rows?.[0]?.amount) === 2500 ? pass('admin corrected the amount') : fail(`edit failed: ${r.status} ${JSON.stringify(rows).slice(0, 140)}`)
  }

  console.log('\n2. The edit is audited')
  {
    await new Promise((r) => setTimeout(r, 400))
    const log = await (await svc(`/rest/v1/admin_audit_log?record_id=eq.${depositId}&select=*&order=created_at.desc`)).json()
    const entry = log[0]
    if (!entry) fail('no audit entry was written')
    else {
      pass(`audit entry written (${entry.action} on ${entry.table_name})`)
      Number(entry.before?.amount) === 1000 && Number(entry.after?.amount) === 2500
        ? pass('audit captured before and after values')
        : fail(`audit values wrong: before=${entry.before?.amount} after=${entry.after?.amount}`)
      entry.admin_id === adminId ? pass('audit attributes the acting admin') : fail('audit did not record who made the change')
    }
  }

  console.log('\n3. Investors still cannot touch records')
  {
    const r = await asUser(investorToken, `/rest/v1/deposits?id=eq.${depositId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ amount: 999999 }),
    })
    const rows = await r.json().catch(() => [])
    const changed = Array.isArray(rows) && rows.length > 0
    changed ? fail('SELF-CREDIT: investor edited their own deposit') : pass('investor cannot edit a deposit')

    const del = await asUser(investorToken, `/rest/v1/deposits?id=eq.${depositId}`, { method: 'DELETE' })
    const still = await (await svc(`/rest/v1/deposits?id=eq.${depositId}&select=id`)).json()
    still.length === 1 ? pass('investor cannot delete a deposit') : fail('investor deleted a deposit')
  }

  console.log('\n4. Admin can delete a record')
  {
    const r = await asUser(adminToken, `/rest/v1/deposits?id=eq.${depositId}`, { method: 'DELETE' })
    const gone = await (await svc(`/rest/v1/deposits?id=eq.${depositId}&select=id`)).json()
    gone.length === 0 ? pass('admin deleted the deposit') : fail(`delete failed: ${r.status}`)

    await new Promise((res) => setTimeout(res, 400))
    const log = await (await svc(`/rest/v1/admin_audit_log?record_id=eq.${depositId}&action=eq.delete&select=before`)).json()
    log.length && Number(log[0].before?.amount) === 2500
      ? pass('deletion snapshotted the row before removing it')
      : fail('deletion was not audited with a snapshot')
  }

  console.log('\n5. Deleting an investor')
  {
    const notAdmin = await callFn(investorToken, 'admin-delete-user', { user_id: adminId })
    notAdmin.status === 403 ? pass('non-admin cannot delete users (403)') : fail(`investor delete-user returned ${notAdmin.status}`)

    const self = await callFn(adminToken, 'admin-delete-user', { user_id: adminId })
    self.status === 400 ? pass('admin cannot delete themselves') : fail(`self-delete returned ${self.status}`)

    const otherAdmin = await callFn(adminToken, 'admin-delete-user', { user_id: admin2Id })
    otherAdmin.status === 400 ? pass('cannot delete another admin without demoting') : fail(`admin-delete-admin returned ${otherAdmin.status}`)

    // Give the investor a record, then delete them and check it cascaded.
    await svc('/rest/v1/deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id: investorId, amount: 500, status: 'approved', method_label: 'cascade probe' }),
    })

    const del = await callFn(adminToken, 'admin-delete-user', { user_id: investorId })
    const body = await del.json()
    del.ok ? pass(`investor deleted (${body.deleted?.deposits ?? 0} deposit rows)`) : fail(`delete failed: ${del.status} ${JSON.stringify(body).slice(0, 160)}`)

    const prof = await (await svc(`/rest/v1/profiles?id=eq.${investorId}&select=id`)).json()
    prof.length === 0 ? pass('profile row cascaded away') : fail('profile row survived the delete')

    const deps = await (await svc(`/rest/v1/deposits?user_id=eq.${investorId}&select=id`)).json()
    deps.length === 0 ? pass('their deposits cascaded away') : fail(`${deps.length} deposit(s) left orphaned`)

    const audit = await (await svc(`/rest/v1/admin_audit_log?subject_id=eq.${investorId}&action=eq.delete&select=before,note`)).json()
    audit.length && audit.some((a) => a.before?.profile)
      ? pass('deletion kept a full snapshot in the audit log')
      : fail('no snapshot was kept for the deleted investor')
    investorId = null  // already gone; skip cleanup
  }

  console.log('\n6. Audit log is admin-only')
  {
    const inv2 = await mk(`crud-inv2-${stamp}@keelstone-test.invalid`, 'Reader')
    const tok = await login(`crud-inv2-${stamp}@keelstone-test.invalid`)
    const rows = await (await asUser(tok, '/rest/v1/admin_audit_log?select=id')).json()
    Array.isArray(rows) && rows.length === 0
      ? pass('investor sees no audit entries')
      : fail(`LEAK: investor read ${rows.length ?? '?'} audit entries`)
    await svc(`/auth/v1/admin/users/${inv2}`, { method: 'DELETE' }).catch(() => {})
  }
}

try {
  await main()
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  for (const id of [adminId, admin2Id, investorId].filter(Boolean)) {
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
  for (const id of [adminId, admin2Id].filter(Boolean)) {
    await svc(`/rest/v1/admin_audit_log?admin_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
  }
  console.log('  removed test users and audit entries')
}

console.log(failures === 0 ? '\n\x1b[32mAll admin CRUD checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exitCode = failures === 0 ? 0 : 1
