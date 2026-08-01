// Verifies the KYC migration: table, RLS isolation, storage bucket, and the
// trigger that mirrors submission status onto profiles.kyc_status.
//
//   source .supabase-secrets.local.sh && node supabase/verify-kyc.mjs

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

console.log('\n1. Table + bucket')
{
  const t = await svc('/rest/v1/kyc_submissions?limit=1')
  t.ok ? pass('kyc_submissions exists') : fail(`kyc_submissions — ${t.status} ${(await t.text()).slice(0, 90)}`)

  const b = await svc('/storage/v1/bucket/kyc-documents')
  if (b.ok) {
    const info = await b.json()
    info.public === false ? pass('kyc-documents bucket is private') : fail('kyc-documents bucket is PUBLIC — identity documents would be world-readable')
  } else {
    fail(`kyc-documents bucket missing (${b.status})`)
  }
}

console.log('\n2. Isolation + status trigger')
{
  const stamp = Date.now()
  let alice, bob
  const mk = async (email) => {
    const r = await svc('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'Test-Passw0rd!' + stamp, email_confirm: true }),
    })
    if (!r.ok) throw new Error(`create ${email}: ${r.status} ${(await r.text()).slice(0, 140)}`)
    return (await r.json()).id
  }

  try {
    alice = await mk(`kyc-alice-${stamp}@keelstone-test.invalid`)
    bob = await mk(`kyc-bob-${stamp}@keelstone-test.invalid`)

    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `kyc-alice-${stamp}@keelstone-test.invalid`, password: 'Test-Passw0rd!' + stamp }),
    })
    const { access_token } = await login.json()

    // Alice files her own submission — allowed.
    const own = await fetch(`${URL}/rest/v1/kyc_submissions`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: alice, status: 'submitted', full_name: 'Alice Test',
        date_of_birth: '1990-01-01', country: 'United Kingdom', address: '1 Test St',
        id_type: 'passport', id_number: 'X1234567',
      }),
    })
    own.ok ? pass('investor can file their own KYC') : fail(`investor cannot file own KYC — ${own.status} ${(await own.text()).slice(0, 140)}`)

    // Trigger should have flipped the profile to 'pending'.
    const prof = await (await svc(`/rest/v1/profiles?id=eq.${alice}&select=kyc_status`)).json()
    prof[0]?.kyc_status === 'pending'
      ? pass("trigger set profiles.kyc_status = 'pending'")
      : fail(`trigger did not sync — profiles.kyc_status is '${prof[0]?.kyc_status}'`)

    // Alice must not be able to file on Bob's behalf.
    const forged = await fetch(`${URL}/rest/v1/kyc_submissions`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: bob, status: 'submitted', full_name: 'Forged',
        date_of_birth: '1990-01-01', country: 'UK', address: 'x',
        id_type: 'passport', id_number: 'Y999',
      }),
    })
    forged.ok ? fail("IMPERSONATION: Alice filed a KYC submission as Bob") : pass(`cannot file KYC for another user (${forged.status})`)

    // Alice must not be able to approve herself.
    const selfApprove = await fetch(`${URL}/rest/v1/kyc_submissions?user_id=eq.${alice}`, {
      method: 'PATCH',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    })
    const after = await (await svc(`/rest/v1/profiles?id=eq.${alice}&select=kyc_status`)).json()
    after[0]?.kyc_status === 'approved'
      ? fail('SELF-APPROVAL: Alice approved her own KYC')
      : pass(`investor cannot approve their own KYC (${selfApprove.status})`)

    // Storage: uploading outside her own prefix must be refused.
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], { type: 'image/jpeg' })
    const fd = new FormData()
    fd.append('file', blob, 'x.jpg')
    const wrongPrefix = await fetch(`${URL}/storage/v1/object/kyc-documents/${bob}/stolen.jpg`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}` },
      body: fd,
    })
    wrongPrefix.ok
      ? fail("STORAGE LEAK: Alice uploaded into Bob's folder")
      : pass(`cannot upload into another user's folder (${wrongPrefix.status})`)
  } catch (e) {
    fail(e.message)
  } finally {
    for (const id of [alice, bob].filter(Boolean)) {
      await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
    }
    console.log('  cleaned up test users')
  }
}

console.log(failures === 0 ? '\n\x1b[32mAll KYC checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exit(failures === 0 ? 0 : 1)
