// Resend client + branded email templates.
//
// One module so every function sends mail that looks the same and fails the
// same way. Sending is ALWAYS best-effort: a mail outage must never roll back
// a deposit or block a signup.

const BRAND = 'Keelstone Trust'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export const siteUrl = () =>
  (Deno.env.get('SITE_URL') ?? 'https://keelstone-trust.com').replace(/\/+$/, '')

const fromAddress = () =>
  Deno.env.get('EMAIL_FROM') ?? `${BRAND} <noreply@keelstone-trust.com>`

/**
 * Send one email. Never throws — returns false on failure so callers can carry
 * on. `idempotencyKey` stops a retried function invocation sending twice
 * (Resend keys expire after 24h).
 */
export async function sendMail(opts: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  idempotencyKey?: string
}): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set — skipping email:', opts.subject)
    return false
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey.slice(0, 256)

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: fromAddress(),
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      console.error('Resend rejected the send:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('Resend request failed:', err)
    return false
  }
}

/* ── templates ───────────────────────────────────────────── */

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const money = (n: number) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Shell every email shares: header, body slot, optional CTA, footer. */
function layout(opts: {
  eyebrow: string
  heading: string
  body: string
  cta?: { label: string; href: string }
  footnote?: string
}) {
  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
         <tr><td style="background:#6d28d9;border-radius:6px;">
           <a href="${opts.cta.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(opts.cta.label)}</a>
         </td></tr>
       </table>`
    : ''

  const footnote = opts.footnote
    ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#8a829a;">${opts.footnote}</p>`
    : ''

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8f6fc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fc;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e3f0;border-radius:8px;overflow:hidden;">
          <tr><td style="background:#111018;padding:26px 32px;">
            <div style="font-size:20px;color:#ffffff;letter-spacing:.3px;">${BRAND}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">${esc(opts.eyebrow)}</div>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111018;">${esc(opts.heading)}</h1>
            ${opts.body}
            ${cta}
            ${footnote}
          </td></tr>
          <tr><td style="background:#f8f6fc;padding:18px 32px;border-top:1px solid #e8e3f0;">
            <p style="margin:0 0 6px;font-size:11.5px;line-height:1.6;color:#8a829a;">
              Capital is at risk. Past performance does not guarantee future results.
              Target returns are not guaranteed.
            </p>
            <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8a829a;">
              &copy; ${new Date().getFullYear()} ${BRAND}. Automated message — please don't reply.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

const row = (label: string, value: string, mono = false) => `
  <tr>
    <td style="padding:7px 0;font-size:13px;color:#8a829a;width:38%;">${esc(label)}</td>
    <td style="padding:7px 0;font-size:13px;color:#111018;${mono ? 'font-family:monospace;word-break:break-all;' : 'font-weight:600;'}">${esc(value)}</td>
  </tr>`

/** To admins: an investor has filed a deposit request. */
export function depositRequestedAdminEmail(d: {
  investorName: string; investorEmail: string; amount: number
  methodLabel: string; planLabel: string; reference?: string
}) {
  return layout({
    eyebrow: 'Admin notification',
    heading: 'New deposit request',
    body: `
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        An investor has submitted a deposit request and is waiting on confirmation.
        Verify the funds arrived, then approve or reject it in the admin console.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e3f0;margin-bottom:24px;">
        ${row('Investor', d.investorName)}
        ${row('Email', d.investorEmail)}
        ${row('Amount', '$' + money(d.amount))}
        ${row('Method', d.methodLabel)}
        ${row('Destination', d.planLabel)}
        ${d.reference ? row('Reference', d.reference, true) : ''}
      </table>`,
    cta: { label: 'Review in admin console', href: `${siteUrl()}/admin` },
  })
}

/** To the investor: we've received your request. */
export function depositReceivedEmail(d: { firstName: string; amount: number; planLabel: string }) {
  return layout({
    eyebrow: 'Investor Portal',
    heading: 'We’ve received your deposit request',
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">${d.firstName ? `Hello ${esc(d.firstName)},` : 'Hello,'}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        Thanks — we’ve logged your deposit of <b>$${money(d.amount)}</b> for
        <b>${esc(d.planLabel)}</b>. Our team is verifying the transfer now.
        It shows as <b style="color:#a16207;">pending</b> on your dashboard until
        that’s done, and we’ll email you the moment it clears.
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        Deposits are usually confirmed within a few hours. Nothing further is
        needed from you.
      </p>`,
    cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
  })
}

/** To the investor: approved or rejected. */
export function depositReviewedEmail(d: {
  firstName: string; amount: number; approved: boolean
  planName?: string | null; note?: string
}) {
  if (d.approved) {
    const where = d.planName
      ? `into your <b>${esc(d.planName)}</b> plan`
      : 'to your available balance'
    return layout({
      eyebrow: 'Investor Portal',
      heading: 'Deposit confirmed',
      body: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">${d.firstName ? `Hello ${esc(d.firstName)},` : 'Hello,'}</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
          We’ve verified your deposit of <b>$${money(d.amount)}</b> and credited it ${where}.
          ${d.planName ? 'It’s now earning returns, accruing daily.' : 'You can allocate it to an investment plan whenever you’re ready.'}
        </p>`,
      cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
    })
  }
  return layout({
    eyebrow: 'Investor Portal',
    heading: 'We couldn’t confirm your deposit',
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">${d.firstName ? `Hello ${esc(d.firstName)},` : 'Hello,'}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        We weren’t able to confirm your deposit request of <b>$${money(d.amount)}</b>.
        ${d.note ? `<br><br><b>Reason given:</b> ${esc(d.note)}` : ''}
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        If you believe this is a mistake, reply to this email or contact your
        advisor and we’ll look into it right away.
      </p>`,
    cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
  })
}

/** To the investor: withdrawal approved or declined. */
export function withdrawalReviewedEmail(d: {
  firstName: string; amount: number; approved: boolean; note?: string
}) {
  return layout({
    eyebrow: 'Investor Portal',
    heading: d.approved ? 'Withdrawal approved' : 'Withdrawal request declined',
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">${d.firstName ? `Hello ${esc(d.firstName)},` : 'Hello,'}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
        ${d.approved
          ? `Your withdrawal of <b>$${money(d.amount)}</b> has been approved and is being sent to the wallet address you provided.`
          : `Your withdrawal request of <b>$${money(d.amount)}</b> was not approved.${d.note ? `<br><br><b>Reason given:</b> ${esc(d.note)}` : ''}`}
      </p>`,
    cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
  })
}

/** Sent once at signup — verify, KYC, fund. */
export function welcomeEmail(firstName: string) {
  const steps = [
    ['1', 'Verify your email',
     'Confirm your address so we can secure your account and send you activity alerts. There’s a link in your inbox — it takes one click.'],
    ['2', 'Complete your identity check',
     'Every investor completes a short identity verification (KYC) before funds can move. It’s a regulatory requirement and it protects your account. Have a government-issued ID handy — most people finish in under five minutes.'],
    ['3', 'Make your first deposit',
     'Choose a strategy, send your deposit, and our team confirms it. Your capital starts accruing from the day it’s confirmed — so the sooner it lands, the sooner it works for you.'],
  ]
    .map(([n, title, body]) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr>
          <td width="34" valign="top" style="padding-top:2px;">
            <div style="width:26px;height:26px;border-radius:50%;background:#6d28d9;color:#ffffff;font-size:13px;font-weight:700;text-align:center;line-height:26px;">${n}</div>
          </td>
          <td valign="top">
            <div style="font-size:15px;font-weight:700;color:#111018;margin-bottom:4px;">${esc(title)}</div>
            <div style="font-size:14px;line-height:1.6;color:#3d3450;">${esc(body)}</div>
          </td>
        </tr>
      </table>`)
    .join('')

  return layout({
    eyebrow: 'Investor Portal',
    heading: firstName ? `Welcome, ${firstName}.` : 'Welcome.',
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">
        Your ${BRAND} account is open. You’re three short steps away from having
        your capital professionally managed.
      </p>
      <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#3d3450;">
        Returns accrue <b>daily</b> from the moment a deposit is confirmed, so
        finishing setup early genuinely matters — every day your account sits
        idle is a day it isn’t earning.
      </p>
      ${steps}`,
    cta: { label: 'Complete my setup', href: `${siteUrl()}/dashboard` },
    footnote: 'Prefer to talk it through first? Reply to this email and an advisor will walk you through your options — there’s no obligation to invest.',
  })
}

/** Free-form admin → investor email (support inbox reply / compose). */
export function plainAdminEmail(d: { heading: string; bodyText: string }) {
  const paragraphs = d.bodyText
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3d3450;">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
  return layout({ eyebrow: 'Investor Portal', heading: d.heading, body: paragraphs })
}
