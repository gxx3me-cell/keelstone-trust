// support-email
//
// Admin sends an email to an investor — either a reply to something in the
// support inbox, or a fresh compose. Both are logged to `messages` so the
// thread is visible in the console afterwards.
//
// Body:
//   { action: 'reply',  message_id, to_email, subject, body }
//   { action: 'send',   to_email, subject, body }

import { preflight, json, getCaller, adminClient, displayName } from '../_shared/auth.ts'
import { sendMail, plainAdminEmail } from '../_shared/email.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // The caller may pass `action` explicitly, but the presence of a message_id
  // is what actually makes this a reply — the admin console omits `action`.
  const messageId = String(body.message_id ?? '').trim()
  const action = String(body.action ?? (messageId ? 'reply' : 'send'))
  const to = String(body.to_email ?? '').trim().toLowerCase()
  const subject = String(body.subject ?? '').trim()
  const text = String(body.body ?? '').trim()

  if (!EMAIL_RE.test(to)) return json({ error: 'Enter a valid recipient email.' }, 400)
  if (!subject) return json({ error: 'Enter a subject.' }, 400)
  if (!text) return json({ error: 'Write a message.' }, 400)

  const admin = adminClient()
  const adminName = displayName(caller.profile, caller.email)

  const sent = await sendMail({
    to,
    subject,
    replyTo: caller.email ?? undefined,
    html: plainAdminEmail({ heading: subject, bodyText: text }),
  })
  if (!sent) return json({ error: 'Could not send the email. Check the Resend configuration.' }, 502)

  if (action === 'reply' && messageId) {
    await admin
      .from('messages')
      .update({
        status: 'replied',
        reply_body: text,
        replied_by: adminName,
        replied_at: new Date().toISOString(),
      })
      .eq('id', messageId)
  }

  // Log the outbound message so it shows in the inbox thread.
  await admin.from('messages').insert({
    email: to,
    subject,
    message: text,
    direction: 'outbound',
    status: 'replied',
    replied_by: adminName,
    replied_at: new Date().toISOString(),
  })

  return json({ ok: true })
})
