// admin-delete-user
//
// Permanently removes an investor: their auth account and everything cascading
// from it (profile, deposits, investments, withdrawals, KYC).
//
// Runs server-side because deleting an auth.users row needs the service role —
// there is no RLS policy that can grant it.
//
// Guarded by admin_may_delete_user(), which refuses to delete an admin or the
// caller themselves. An audit entry is written BEFORE the delete, so the record
// of what was removed survives the removal.
//
// Body: { user_id, note? }

import { preflight, json, getCaller, adminClient, displayName } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight()
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const caller = await getCaller(req)
  if (!caller) return json({ error: 'You must be signed in.' }, 401)
  if (!caller.isAdmin) return json({ error: 'Admins only.' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const userId = String(body.user_id ?? '').trim()
  const note = String(body.note ?? '').trim().slice(0, 500)
  if (!userId) return json({ error: 'Missing user id.' }, 400)

  const admin = adminClient()

  // Belt and braces: the same checks the DB function makes, run here so a
  // refusal comes back as a clean message rather than a constraint error.
  if (userId === caller.id) {
    return json({ error: 'You cannot delete your own account.' }, 400)
  }

  const { data: target } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!target) return json({ error: 'That account no longer exists.' }, 404)
  if (target.role === 'admin') {
    return json({ error: 'That account is an admin. Demote them first.' }, 400)
  }

  // Snapshot everything before it goes, so the audit entry is meaningful.
  const [deposits, investments, withdrawals] = await Promise.all([
    admin.from('deposits').select('*').eq('user_id', userId),
    admin.from('investments').select('*').eq('user_id', userId),
    admin.from('withdrawals').select('*').eq('user_id', userId),
  ])

  const snapshot = {
    profile: target,
    deposits: deposits.data ?? [],
    investments: investments.data ?? [],
    withdrawals: withdrawals.data ?? [],
  }

  const { error: auditError } = await admin.from('admin_audit_log').insert({
    admin_id: caller.id,
    admin_email: caller.email,
    action: 'delete',
    table_name: 'auth.users',
    record_id: userId,
    subject_id: userId,
    before: snapshot,
    after: null,
    note: note || `Deleted investor ${displayName(target, target.email)}`,
  })

  // If we can't record it, don't do it — an untraceable deletion of financial
  // records is worse than a failed one.
  if (auditError) {
    console.error('audit write failed, refusing to delete:', auditError)
    return json({ error: 'Could not write the audit record. Nothing was deleted.' }, 500)
  }

  // Cascades to profiles, deposits, investments, withdrawals, kyc_submissions
  // via their on delete cascade foreign keys.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('user delete failed:', deleteError)
    return json({ error: 'Could not delete that account.' }, 500)
  }

  return json({
    ok: true,
    deleted: {
      user_id: userId,
      email: target.email,
      deposits: snapshot.deposits.length,
      investments: snapshot.investments.length,
      withdrawals: snapshot.withdrawals.length,
    },
  })
})
