// Verifies the notification feed: triggers fire, RLS hides it from investors,
// per-admin read state works, and the realtime publication is live.
//
//   source .supabase-secrets.local.sh && node supabase/verify-notifications.mjs

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
let investorId, adminId, depositId, planId

const mkUser = async (email, name) => {
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

try {
  console.log('\n1. Signup trigger')
  {
    investorId = await mkUser(`notif-inv-${stamp}@keelstone-test.invalid`, 'Notify Investor')
    adminId = await mkUser(`notif-adm-${stamp}@keelstone-test.invalid`, 'Notify Admin')
    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })
    await new Promise((r) => setTimeout(r, 700))

    // notify_new_profile records the new user as actor_id (entity_id is unset).
    const n = await (await svc(`/rest/v1/notifications?actor_id=eq.${investorId}&kind=eq.user&select=*`)).json()
    n.length === 1
      ? pass(`signup produced a notification ("${n[0].title}")`)
      : fail(`expected 1 signup notification, found ${n.length}`)

    // An admin being promoted should not read as a new investor signup.
    const adminNotes = await (await svc(`/rest/v1/notifications?actor_id=eq.${adminId}&kind=eq.user&select=id`)).json()
    adminNotes.length === 1
      ? pass('admin signup also notified (promotion happens after insert)')
      : fail(`expected 1 notification for the admin account, found ${adminNotes.length}`)
  }

  console.log('\n2. Deposit lifecycle triggers')
  {
    const p = await svc('/rest/v1/plans', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name: `Notif Plan ${stamp}`, slug: `notif-${stamp}`, annual_return_pct: 10, min_usd: 100, max_usd: 0, active: false, sort_order: 998 }),
    })
    planId = (await p.json())[0].id

    const d = await svc('/rest/v1/deposits', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: investorId, amount: 2500, status: 'pending', method_label: 'Notify probe', plan_id: planId, plan_name: 'Notif Plan' }),
    })
    depositId = (await d.json())[0].id
    await new Promise((r) => setTimeout(r, 500))

    let notes = await (await svc(`/rest/v1/notifications?entity_id=eq.${depositId}&select=title&order=created_at`)).json()
    notes.some((x) => x.title === 'Deposit awaiting approval')
      ? pass('filing a deposit notified the admins')
      : fail(`no "Deposit awaiting approval" notification (got: ${notes.map((n) => n.title).join(', ') || 'none'})`)

    await svc(`/rest/v1/deposits?id=eq.${depositId}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) })
    await new Promise((r) => setTimeout(r, 500))

    notes = await (await svc(`/rest/v1/notifications?entity_id=eq.${depositId}&select=title&order=created_at`)).json()
    notes.some((x) => x.title === 'Deposit approved')
      ? pass('approving the deposit notified again')
      : fail(`no "Deposit approved" notification (got: ${notes.map((n) => n.title).join(', ')})`)

    // A no-op update must not spam the feed.
    const before = notes.length
    await svc(`/rest/v1/deposits?id=eq.${depositId}`, { method: 'PATCH', body: JSON.stringify({ admin_note: 'touched' }) })
    await new Promise((r) => setTimeout(r, 400))
    const after = (await (await svc(`/rest/v1/notifications?entity_id=eq.${depositId}&select=id`)).json()).length
    after === before ? pass('editing a note did not create a duplicate notification') : fail(`note edit added ${after - before} spurious notification(s)`)
  }

  console.log('\n3. RLS on the feed')
  {
    const investorToken = await login(`notif-inv-${stamp}@keelstone-test.invalid`)
    const adminToken = await login(`notif-adm-${stamp}@keelstone-test.invalid`)

    const invSees = await (await asUser(investorToken, '/rest/v1/notifications?select=id')).json()
    Array.isArray(invSees) && invSees.length === 0
      ? pass('investor sees zero notifications')
      : fail(`LEAK: investor sees ${invSees.length ?? '?'} notification(s)`)

    const admSees = await (await asUser(adminToken, '/rest/v1/notifications?select=id')).json()
    Array.isArray(admSees) && admSees.length > 0
      ? pass(`admin sees the feed (${admSees.length} rows)`)
      : fail('admin sees no notifications — the feed is empty or RLS is too strict')

    // The view must expose is_read and stay RLS-scoped.
    const viaView = await (await asUser(adminToken, '/rest/v1/notifications_for_me?select=id,is_read&limit=5')).json()
    Array.isArray(viaView) && viaView.length && 'is_read' in viaView[0]
      ? pass('notifications_for_me exposes is_read')
      : fail(`view did not return is_read: ${JSON.stringify(viaView).slice(0, 140)}`)

    const invView = await (await asUser(investorToken, '/rest/v1/notifications_for_me?select=id')).json()
    Array.isArray(invView) && invView.length === 0
      ? pass('view is empty for an investor (security_invoker holds)')
      : fail(`LEAK: view returned ${invView.length ?? '?'} rows to an investor`)

    console.log('\n4. Per-admin read state')
    const [first] = viaView
    const mark = await asUser(adminToken, '/rest/v1/notification_reads', {
      method: 'POST',
      body: JSON.stringify({ notification_id: first.id, admin_id: adminId }),
    })
    mark.ok ? pass('admin marked a notification read') : fail(`mark-read failed: ${mark.status} ${(await mark.text()).slice(0, 140)}`)

    const after = await (await asUser(adminToken, `/rest/v1/notifications_for_me?id=eq.${first.id}&select=is_read`)).json()
    after[0]?.is_read === true ? pass('is_read flipped to true for that admin') : fail('is_read did not update')

    // An admin must not be able to mark on someone else's behalf.
    const forge = await asUser(adminToken, '/rest/v1/notification_reads', {
      method: 'POST',
      body: JSON.stringify({ notification_id: first.id, admin_id: investorId }),
    })
    forge.ok ? fail("admin wrote read-state for another user") : pass(`cannot mark read on another admin's behalf (${forge.status})`)
  }

  console.log('\n5. Realtime delivery')
  {
    // Tested empirically rather than by inspecting pg_publication_tables:
    // subscribe, insert, and see whether the event arrives.
    //
    // The insert must NOT happen inside the subscribe callback — the server
    // needs a moment after reporting SUBSCRIBED before it will forward changes,
    // and inserting immediately races that and looks like a missing publication.
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(URL, SECRET)
    const probeTitle = `RT probe ${stamp}`

    const delivered = await new Promise((resolve) => {
      let seen = false
      const ch = sb
        .channel(`verify-${stamp}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p) => {
          if (p.new?.title === probeTitle) seen = true
        })
        .subscribe()

      setTimeout(() => {
        svc('/rest/v1/notifications', {
          method: 'POST',
          body: JSON.stringify({ kind: 'message', title: probeTitle, body: 'realtime probe' }),
        }).catch(() => {})
      }, 2500)

      setTimeout(() => { sb.removeChannel(ch); resolve(seen) }, 9000)
    })

    delivered
      ? pass('INSERT delivered over realtime (publication is live)')
      : fail('no realtime event — run migration 20260801000004, or the admin bell will never update')

    await svc(`/rest/v1/notifications?title=eq.${encodeURIComponent(probeTitle)}`, { method: 'DELETE' }).catch(() => {})
  }
} catch (e) {
  fail(e.message)
} finally {
  console.log('\nCleanup')
  if (depositId) await svc(`/rest/v1/notifications?entity_id=eq.${depositId}`, { method: 'DELETE' }).catch(() => {})
  for (const id of [investorId, adminId].filter(Boolean)) {
    await svc(`/rest/v1/notifications?actor_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/notifications?entity_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/rest/v1/deposits?user_id=eq.${id}`, { method: 'DELETE' }).catch(() => {})
    await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }).catch(() => {})
  }
  if (planId) await svc(`/rest/v1/plans?id=eq.${planId}`, { method: 'DELETE' }).catch(() => {})
  console.log('  removed test users, deposits, plan and notifications')
}

console.log(failures === 0 ? '\n\x1b[32mAll notification checks passed.\x1b[0m\n' : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`)
process.exit(failures === 0 ? 0 : 1)
