// Resend client + branded email templates.
//
// One module so every function sends mail that looks the same and fails the
// same way. Sending is ALWAYS best-effort: a mail outage must never roll back
// a deposit or block a signup.
//
// ── Design notes ────────────────────────────────────────────────────────────
// Email HTML is not web HTML. Constraints this file works within:
//
//  * Tables, not flexbox/grid. Outlook renders via Word and ignores modern CSS.
//  * Inline styles only. <style> blocks are stripped by Gmail's clipping and
//    by most webmail sanitisers.
//  * No base64 images — Gmail clips messages over ~102KB and blocks data URIs.
//    The mark is hosted publicly and referenced by URL, with the wordmark as
//    the fallback when images are blocked (which is the default in Outlook).
//  * Every email ships a plain-text part. Without one, spam filters score you
//    worse and the message is unreadable in text-only clients.
//  * A preheader — the grey preview line after the subject in an inbox list —
//    is set explicitly. Left unset, clients scrape the first visible text,
//    which is usually the logo alt text or "View in browser".
//
// Palette is taken from the logo: a green shield. The previous purple was left
// over from the old Lumen branding and clashed with it.

const BRAND = 'Keelstone Trust'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// Hosted in the public `brand` bucket. The domain itself doesn't serve static
// files yet, so this is the reliable origin.
const LOGO_URL =
  'https://ieimrautxzihehjooqks.supabase.co/storage/v1/object/public/brand/keelstone-mark.png'

const C = {
  ink: '#0f1b16',        // headings
  body: '#3d4c45',       // paragraphs
  muted: '#6b7d73',      // secondary, footer
  faint: '#8f9d95',      // legal
  brand: '#137045',      // AA on white at small sizes
  brandDark: '#0e5232',
  brandSoft: '#eef7f2',
  line: '#dde5e0',
  lineSoft: '#eaf0ec',
  canvas: '#f4f7f5',
  white: '#ffffff',
  warn: '#a16207',
  warnSoft: '#fdf6e7',
  loss: '#c0392f',
  lossSoft: '#fdeeec',
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif"

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
  text?: string
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
        // Derived from the HTML when a caller doesn't supply one, so no email
        // ever goes out without a text part.
        text: opts.text ?? toPlainText(opts.html),
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

/* ── helpers ─────────────────────────────────────────────── */

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const money = (n: number) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Crude HTML → text, good enough for a fallback part. */
function toPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map((l) => l.trim()).join('\n')
    .trim()
}

/* ── layout ──────────────────────────────────────────────── */

type Cta = { label: string; href: string }

/**
 * The shell every email shares.
 *
 * Structure: logo lockup on a light canvas → white content card → footer.
 * A hairline of brand green sits under the header, which gives the card an
 * anchor without the heavy dark banner the previous version used (that read as
 * a generic SaaS template and made the green logo look bolted on).
 */
function layout(opts: {
  preheader: string
  eyebrow?: string
  heading: string
  body: string
  cta?: Cta
  secondaryCta?: Cta
  footnote?: string
}) {
  const cta = opts.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
        <tr>
          <td align="center" bgcolor="${C.brand}" style="border-radius:6px;">
            <a href="${opts.cta.href}"
               style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:${C.white};text-decoration:none;border-radius:6px;">
              ${esc(opts.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const secondary = opts.secondaryCta
    ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.muted};">
         <a href="${opts.secondaryCta.href}" style="color:${C.brand};text-decoration:underline;">${esc(opts.secondaryCta.label)}</a>
       </p>`
    : ''

  const footnote = opts.footnote
    ? `<p style="margin:22px 0 0;padding:16px 0 0;border-top:1px solid ${C.lineSoft};font-family:${FONT};font-size:13.5px;line-height:1.65;color:${C.muted};">${opts.footnote}</p>`
    : ''

  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:${C.brand};">${esc(opts.eyebrow)}</p>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.canvas};-webkit-text-size-adjust:100%;">

<!-- Inbox preview line. Hidden in the body; the &#8199; padding stops clients
     pulling in whatever text follows. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
  ${esc(opts.preheader)}${'&#8199;&#847;'.repeat(60)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.canvas};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Logo lockup -->
        <tr>
          <td align="center" style="padding:0 0 22px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:11px;" valign="middle">
                  <img src="${LOGO_URL}" width="38" height="38" alt="${BRAND}"
                       style="display:block;width:38px;height:38px;border:0;outline:none;text-decoration:none;">
                </td>
                <td valign="middle" style="font-family:${FONT};">
                  <div style="font-size:18px;font-weight:600;color:${C.ink};letter-spacing:-.2px;line-height:1.2;">${BRAND}</div>
                  <div style="font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};margin-top:2px;">Investor Portal</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content card -->
        <tr>
          <td style="background:${C.white};border:1px solid ${C.line};border-radius:10px;overflow:hidden;">
            <!-- brand hairline -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="3" style="height:3px;line-height:3px;font-size:0;background:${C.brand};">&nbsp;</td></tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:34px 34px 32px;">
                  ${eyebrow}
                  <h1 style="margin:0 0 18px;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:600;color:${C.ink};letter-spacing:-.3px;">${esc(opts.heading)}</h1>
                  ${opts.body}
                  ${cta}
                  ${secondary}
                  ${footnote}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:22px 8px 0;font-family:${FONT};">
            <p style="margin:0 0 10px;font-size:12px;line-height:1.65;color:${C.faint};">
              Capital is at risk. Past performance does not guarantee future results.
              Target returns are not guaranteed.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.65;color:${C.faint};">
              &copy; ${new Date().getFullYear()} ${BRAND} &middot; This is an automated message.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/* ── content blocks ──────────────────────────────────────── */

const p = (html: string, margin = '0 0 16px') =>
  `<p style="margin:${margin};font-family:${FONT};font-size:15.5px;line-height:1.68;color:${C.body};">${html}</p>`

const greet = (firstName: string) =>
  p(firstName ? `Hello ${esc(firstName)},` : 'Hello,')

/** A figure worth pulling out of the prose — an amount, a balance. */
function statement(label: string, value: string, tone: 'brand' | 'warn' = 'brand') {
  const bg = tone === 'warn' ? C.warnSoft : C.brandSoft
  const fg = tone === 'warn' ? C.warn : C.brandDark
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
      <tr>
        <td style="background:${bg};border-radius:8px;padding:18px 20px;font-family:${FONT};">
          <div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${fg};opacity:.75;">${esc(label)}</div>
          <div style="font-size:28px;font-weight:600;color:${fg};margin-top:5px;letter-spacing:-.5px;">${esc(value)}</div>
        </td>
      </tr>
    </table>`
}

/** Key/value detail rows — used for the admin deposit notification. */
function details(rows: [string, string, boolean?][]) {
  const body = rows
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v, mono]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid ${C.lineSoft};font-family:${FONT};font-size:13.5px;color:${C.muted};width:38%;vertical-align:top;">${esc(k)}</td>
        <td style="padding:9px 0;border-bottom:1px solid ${C.lineSoft};font-family:${mono ? 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace' : FONT};font-size:13.5px;color:${C.ink};font-weight:${mono ? '400' : '600'};word-break:${mono ? 'break-all' : 'normal'};">${esc(v)}</td>
      </tr>`)
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;border-top:1px solid ${C.lineSoft};">${body}</table>`
}

/** Numbered steps — the welcome email's three actions. */
function steps(items: [string, string][]) {
  return items
    .map(([title, text], i) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
        <tr>
          <td width="30" valign="top" style="padding-top:1px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="24" height="24" align="center" valign="middle"
                    style="width:24px;height:24px;background:${C.brandSoft};border-radius:12px;font-family:${FONT};font-size:12px;font-weight:700;color:${C.brand};line-height:24px;">${i + 1}</td>
              </tr>
            </table>
          </td>
          <td valign="top" style="padding-left:12px;font-family:${FONT};">
            <div style="font-size:15px;font-weight:600;color:${C.ink};margin-bottom:3px;">${esc(title)}</div>
            <div style="font-size:14px;line-height:1.62;color:${C.body};">${esc(text)}</div>
          </td>
        </tr>
      </table>`)
    .join('')
}

/** Inline callout for warnings and caveats. */
function callout(text: string, tone: 'warn' | 'loss' | 'brand' = 'warn') {
  const bg = { warn: C.warnSoft, loss: C.lossSoft, brand: C.brandSoft }[tone]
  const fg = { warn: C.warn, loss: C.loss, brand: C.brandDark }[tone]
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background:${bg};border-radius:8px;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${fg};">${text}</td>
      </tr>
    </table>`
}

/* ── templates ───────────────────────────────────────────── */

/** To admins: an investor has filed a deposit request. */
export function depositRequestedAdminEmail(d: {
  investorName: string; investorEmail: string; amount: number
  methodLabel: string; planLabel: string; reference?: string
}) {
  return layout({
    preheader: `${d.investorName} submitted $${money(d.amount)} — awaiting your confirmation.`,
    eyebrow: 'Action required',
    heading: 'New deposit request',
    body:
      p('An investor has submitted a deposit and is waiting on confirmation. Verify the funds arrived, then approve or reject it in the admin console.') +
      statement('Amount', `$${money(d.amount)}`, 'warn') +
      details([
        ['Investor', d.investorName],
        ['Email', d.investorEmail],
        ['Method', d.methodLabel],
        ['Destination', d.planLabel],
        ['Reference', d.reference ?? '', true],
      ]),
    cta: { label: 'Review in admin console', href: `${siteUrl()}/admin` },
  })
}

/** To the investor: we've received your request. */
export function depositReceivedEmail(d: { firstName: string; amount: number; planLabel: string }) {
  return layout({
    preheader: `We've logged your $${money(d.amount)} deposit and are verifying it now.`,
    heading: 'We’ve received your deposit',
    body:
      greet(d.firstName) +
      p(`Thanks — we’ve logged your deposit for <b style="color:${C.ink};">${esc(d.planLabel)}</b> and our team is verifying the transfer now.`) +
      statement('Pending confirmation', `$${money(d.amount)}`, 'warn') +
      p('It will show as <b>pending</b> on your dashboard until that’s done, and we’ll email you the moment it clears. Deposits are usually confirmed within a few hours.') +
      p('Nothing further is needed from you.'),
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
      ? `into your <b style="color:${C.ink};">${esc(d.planName)}</b> plan`
      : 'to your available balance'
    return layout({
      preheader: `Your $${money(d.amount)} deposit is confirmed and credited.`,
      eyebrow: 'Confirmed',
      heading: 'Your deposit has cleared',
      body:
        greet(d.firstName) +
        p(`We’ve verified your deposit and credited it ${where}.`) +
        statement('Credited', `$${money(d.amount)}`) +
        p(d.planName
          ? 'It’s now earning returns, accruing daily from today.'
          : 'You can allocate it to an investment plan whenever you’re ready.'),
      cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
    })
  }

  return layout({
    preheader: `We couldn't confirm your $${money(d.amount)} deposit request.`,
    heading: 'We couldn’t confirm your deposit',
    body:
      greet(d.firstName) +
      p(`We weren’t able to confirm your deposit request of <b style="color:${C.ink};">$${money(d.amount)}</b>.`) +
      (d.note ? callout(`<b>Reason given:</b> ${esc(d.note)}`, 'loss') : '') +
      p('If you believe this is a mistake, reply to this email or contact your advisor and we’ll look into it right away.'),
    cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
  })
}

/** To the investor: withdrawal approved or declined. */
export function withdrawalReviewedEmail(d: {
  firstName: string; amount: number; approved: boolean
  note?: string; address?: string | null
}) {
  return layout({
    preheader: d.approved
      ? `Your $${money(d.amount)} withdrawal is on its way.`
      : `About your $${money(d.amount)} withdrawal request.`,
    eyebrow: d.approved ? 'Approved' : undefined,
    heading: d.approved ? 'Your withdrawal is on its way' : 'Withdrawal request declined',
    body:
      greet(d.firstName) +
      (d.approved
        ? p('Your withdrawal has been approved and is being sent to the Bitcoin address you provided.') +
          statement('Sending', `$${money(d.amount)}`) +
          (d.address ? details([['Bitcoin address', d.address, true]]) : '') +
          p('This amount has been deducted from your available balance. Bitcoin transfers usually confirm within an hour once sent.', '16px 0 0')
        : p(`Your withdrawal request of <b style="color:${C.ink};">$${money(d.amount)}</b> was not approved, and no funds have left your account.`) +
          (d.note ? callout(`<b>Reason given:</b> ${esc(d.note)}`, 'loss') : '') +
          p('Please contact your advisor if you have questions.')),
    cta: { label: 'View my dashboard', href: `${siteUrl()}/dashboard` },
  })
}

/** Sent once at signup — verify, KYC, fund. */
export function welcomeEmail(firstName: string) {
  return layout({
    preheader: 'Three short steps to get your capital working.',
    eyebrow: 'Welcome',
    heading: firstName ? `Welcome, ${firstName}.` : 'Welcome to Keelstone Trust.',
    body:
      p(`Your ${BRAND} account is open. You’re three short steps away from having your capital professionally managed.`) +
      p('Returns accrue <b>daily</b> from the moment a deposit is confirmed, so finishing setup early genuinely matters — every day your account sits idle is a day it isn’t earning.', '0 0 24px') +
      steps([
        ['Verify your email', 'Confirm your address so we can secure your account and send you activity alerts. There’s a link in your inbox — it takes one click.'],
        ['Complete your identity check', 'Every investor completes a short verification (KYC) before funds can move. It’s a regulatory requirement and it protects your account. Have a government-issued ID handy — most people finish in under five minutes.'],
        ['Make your first deposit', 'Choose a strategy, send your deposit, and our team confirms it. Your capital starts accruing from the day it’s confirmed.'],
      ]),
    cta: { label: 'Complete my setup', href: `${siteUrl()}/dashboard` },
    footnote: 'Prefer to talk it through first? Reply to this email and an advisor will walk you through your options — there’s no obligation to invest.',
  })
}

/** Free-form admin → investor email (support inbox reply / compose). */
export function plainAdminEmail(d: { heading: string; bodyText: string }) {
  const paragraphs = d.bodyText
    .split(/\n{2,}/)
    .map((para) => p(esc(para).replace(/\n/g, '<br>')))
    .join('')
  return layout({
    preheader: d.bodyText.slice(0, 110).replace(/\s+/g, ' '),
    heading: d.heading,
    body: paragraphs,
    footnote: 'Replying to this email reaches our team directly.',
  })
}
