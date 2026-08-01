// send-welcome-email
//
// Sent once, right after an investor creates their account. Pushes them toward
// their first deposit: verify email → complete KYC → fund the account.
//
// Idempotent via profiles.welcome_email_sent_at, so a retried signup or a
// double-click can't send twice.

import { preflight, json, getCaller, adminClient, firstNameOf } from '../_shared/auth.ts'
import { sendMail, welcomeEmail } from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight()
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const caller = await getCaller(req)
  if (!caller) return json({ error: 'You must be signed in.' }, 401)
  if (!caller.email) return json({ ok: true, skipped: 'no_email' })

  const admin = adminClient()

  // Claim the send: only proceed if welcome_email_sent_at is still null.
  // Doing this as a conditional update makes concurrent calls safe.
  const { data: claimed } = await admin
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', caller.id)
    .is('welcome_email_sent_at', null)
    .select('id')

  if (!claimed || claimed.length === 0) {
    return json({ ok: true, skipped: 'already_sent' })
  }

  const sent = await sendMail({
    to: caller.email,
    subject: 'Welcome to Keelstone Trust — 3 steps to start earning',
    idempotencyKey: `welcome-${caller.id}`,
    html: welcomeEmail(firstNameOf(caller.profile)),
  })

  // If the send failed, clear the marker so it can be retried later.
  if (!sent) {
    await admin.from('profiles').update({ welcome_email_sent_at: null }).eq('id', caller.id)
    return json({ ok: false, error: 'send_failed' }, 502)
  }

  return json({ ok: true })
})
