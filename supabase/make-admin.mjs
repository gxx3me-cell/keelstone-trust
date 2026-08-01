// Grant or revoke admin on an account.
//
//   source .supabase-secrets.local.sh
//   node supabase/make-admin.mjs you@example.com           # grant
//   node supabase/make-admin.mjs you@example.com --revoke  # revoke
//   node supabase/make-admin.mjs --list                    # who is an admin
//
// This must run server-side. A user cannot promote themselves: the
// guard_profile_privileges trigger blocks any non-admin from changing
// profiles.role, and RLS stops them touching anyone else's row. The service
// key bypasses both, which is exactly why it lives outside the app.

const URL = process.env.SUPABASE_URL
const SECRET = process.env.SUPABASE_SECRET_KEY

const svc = (path, init = {}) =>
  fetch(`${URL}${path}`, {
    ...init,
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

async function main() {
  if (!URL || !SECRET) {
    console.error('Missing env. Run: source .supabase-secrets.local.sh')
    return 1
  }

  const args = process.argv.slice(2)
  const listOnly = args.includes('--list')
  const revoke = args.includes('--revoke')
  const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase()

  if (listOnly) {
    const rows = await (await svc(
      '/rest/v1/profiles?role=eq.admin&select=email,full_name,created_at&order=created_at',
    )).json()
    if (!rows.length) {
      console.log('\nNo admins yet.\n')
    } else {
      console.log(`\n${rows.length} admin${rows.length === 1 ? '' : 's'}:\n`)
      for (const r of rows) console.log(`  ${r.email}${r.full_name ? `  (${r.full_name})` : ''}`)
      console.log()
    }
    return 0
  }

  if (!email) {
    console.error('Usage: node supabase/make-admin.mjs <email> [--revoke]')
    console.error('       node supabase/make-admin.mjs --list')
    return 1
  }

  // The profile must already exist — they must have signed up first.
  const found = await (await svc(
    `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email,role,full_name`,
  )).json()

  if (!found.length) {
    console.error(`\nNo account found for ${email}.`)
    console.error('They need to sign up through the app first, then run this again.\n')
    return 1
  }

  const profile = found[0]
  const nextRole = revoke ? 'investor' : 'admin'

  if (profile.role === nextRole) {
    console.log(`\n${email} is already ${nextRole === 'admin' ? 'an admin' : 'a regular investor'}. Nothing to do.\n`)
    return 0
  }

  // Refuse to remove the last admin — that locks everyone out of the console.
  if (revoke) {
    const admins = await (await svc('/rest/v1/profiles?role=eq.admin&select=id')).json()
    if (admins.length <= 1) {
      console.error('\nRefusing: that is the only admin account. Promote someone else first.\n')
      return 1
    }
  }

  const res = await svc(`/rest/v1/profiles?id=eq.${profile.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ role: nextRole }),
  })

  if (!res.ok) {
    console.error(`\nFailed: ${res.status} ${(await res.text()).slice(0, 200)}\n`)
    return 1
  }

  const [updated] = await res.json()
  console.log(`\n✓ ${updated.email} is now ${updated.role === 'admin' ? 'an ADMIN' : 'a regular investor'}.`)
  console.log(
    revoke
      ? '  They lose console access on next sign-in.\n'
      : '  Sign out and back in to pick up the change, then visit /admin.\n',
  )
  return 0
}

// Setting exitCode rather than calling process.exit() lets pending sockets
// close cleanly — process.exit() mid-fetch trips a libuv assert on Windows.
process.exitCode = await main()
