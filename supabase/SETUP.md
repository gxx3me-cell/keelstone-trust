# Resend + Edge Functions — setup walkthrough

## Status

| | |
|---|---|
| Migrations | ✅ all 7 applied and verified |
| RLS | ✅ 16/16 |
| KYC | ✅ 7/7 |
| Notifications | ✅ 12/12 incl. live realtime |
| Newsletter | ✅ 12/12 |
| Deposit end-to-end | ✅ 26/26 |
| Admin CRUD + audit | ✅ 18/18 |
| Edge Functions | ✅ 6 deployed, ACTIVE, `verify_jwt: true` |
| Resend domain | ✅ `keelstone-trust.com` verified (DKIM + SPF) |
| Transactional email | ✅ delivering from `noreply@keelstone-trust.com` |
| Auth email (SMTP) | ✅ routed through Resend, limit 2/hr → 100/hr |
| Deposit method | ⛔ **still the `0x0000…` placeholder, inactive** |

**One thing left before real investors can deposit** — step 6.

---

Everything below is a record of what was configured and why.

---

## Steps 1 & 2 — Resend ✅ done

`keelstone-trust.com` is **verified** — DKIM and both SPF records green.
Transactional email sends from `noreply@keelstone-trust.com` and delivers to any
address (the sandbox restriction is gone).

DNS records in place:

| Type | Name | Purpose |
|---|---|---|
| TXT | `resend._domainkey` | DKIM signature |
| MX | `send` | SPF return path |
| TXT | `send` | SPF authorisation |
| TXT | `_dmarc` | `p=none` — monitor only |

The optional `MX` on `@` was deliberately **not** added: it would redirect all
inbound mail for the domain and break `contact@keelstone-trust.com`, which is
published on the landing page. Nothing in the app needs inbound mail.

Tighten DMARC to `p=quarantine` after a few weeks of clean sending.

The Resend account is registered to `gxx3me@gmail.com`.

---

## Step 3 — Migrations ✅ done

All five applied and verified:

| Migration | What it adds |
|---|---|
| `…000_initial_schema` | 7 tables, signup trigger, indexes |
| `…001_rls_policies` | RLS on everything, `private.is_admin()`, escalation guard |
| `…002_kyc` | `kyc_submissions` + private Storage bucket |
| `…003_notifications` | feed, per-admin read state, 6 triggers |
| `…004_notifications_realtime` | realtime publication |
| `…005_fix_kyc_guard_conflict` | **bug fix** — see below |

### The bug that migration 005 fixes

Two triggers were fighting on `profiles`: `sync_kyc_status()` mirrors a
submission onto `profiles.kyc_status`, while `guard_profile_privileges()` stops
users editing that column themselves. The guard saw `auth.uid()` as the
*investor* and rejected the system's own write — so **every** KYC submission
failed with "KYC status is set by the compliance team."

The fix has the sync raise a transaction-local flag the guard honours. The
client cannot set that flag; only the SECURITY DEFINER function can, so an
investor still cannot set their own status directly.

Caught by `verify-kyc.mjs`, not by reading the code.

### Re-running verification

```bash
source .supabase-secrets.local.sh
node supabase/verify.mjs                # schema + RLS        16/16
node supabase/verify-kyc.mjs            # KYC + storage        7/7
node supabase/verify-notifications.mjs  # feed + realtime     12/12
node supabase/verify-functions.mjs      # deposit end-to-end  26/26
```

All four create throwaway users and clean up after themselves.

---

## Step 4 — Deploy the Edge Functions ✅ done

All six are deployed and ACTIVE with `verify_jwt: true`. Secrets set:
`RESEND_API_KEY`, `SITE_URL`, `EMAIL_FROM`.

`EMAIL_FROM` is `Keelstone Trust <noreply@keelstone-trust.com>` — the verified
domain. Secrets are read at invocation, so changing one needs no redeploy:

```powershell
npx supabase secrets set "EMAIL_FROM=Keelstone Trust <noreply@keelstone-trust.com>"
```

To redeploy after changing function code:

```powershell
npx supabase functions deploy
```

Verified end to end with `node supabase/verify-functions.mjs` — 26/26, covering
the happy path and the attacks: forged `status: 'approved'` ignored, forged
`user_id` ignored, non-admin approval refused, double-approval refused.

## Step 5 — Auth email ✅ done

Supabase's own auth emails (confirm signup, password reset) now route through
Resend over SMTP, so they come from your verified domain rather than Supabase's
shared sender.

- Host `smtp.resend.com`, port `465`, user `resend`
- Sender `Keelstone Trust <noreply@keelstone-trust.com>`
- **Rate limit raised from 2/hour to 100/hour** — the default would have
  throttled signups the moment more than two people registered in an hour

URL configuration:
- Site URL: `https://keelstone-trust.com`
- Redirect allow-list: `https://keelstone-trust.com/**`, `http://localhost:5173/**`

Without the allow-list, password-reset and confirmation links bounce.

Still worth doing by hand: Dashboard → **Authentication → Email Templates** →
reword *Confirm signup* and *Reset password*. They currently use Supabase's
default copy, which reads generically next to the branded transactional mail.

---

## Step 6 — Replace the placeholder deposit method

There's one seeded deposit method with wallet address `0x0000…0000`, deliberately
**inactive**. Investors cannot deposit until you fix it:

Admin console → **Deposit Methods** → edit it, paste your real wallet address,
tick Active. Add one per coin you accept.

---

## What each function does

| Function | Called from | Does |
|---|---|---|
| `submit-deposit` | investor deposit sheet | Validates against the DB (method active? amount within plan limits?), files a **pending** deposit, emails all admins + a confirmation to the investor |
| `admin-action` | admin deposits/withdrawals | Approves or rejects. Approving a plan deposit creates the investment and emails the investor |
| `send-welcome-email` | signup | Welcome email: verify → KYC → fund. Idempotent |
| `support-email` | admin inbox | Sends a reply or a fresh email, logs it to `messages` |
| `admin-fund` | admin investor manager | Credits an investor directly, or closes an investment |
| `admin-delete-user` | admin investor manager | Deletes an investor and all their records, after snapshotting them to the audit log |

### Why these run server-side

Investors have **no INSERT policy** on `deposits`. If they did, anyone could
POST `{amount: 1000000, status: 'approved'}` and credit themselves. So the
function validates first, then writes with the service-role key.

Every function re-reads plan limits, method state, and the caller's admin role
**from the database** — never from the request body. `verify-functions.mjs`
tests exactly this by sending forged fields and asserting they're ignored.

---

## Troubleshooting

**Emails aren't arriving**
- Resend → **Logs** shows every attempt and why it bounced
- `npx supabase functions logs submit-deposit` shows what the function saw
- The functions log `RESEND_API_KEY is not set` and carry on — a mail failure
  never rolls back a deposit, by design

**"Function not found" in the browser**
- `npx supabase functions list` — confirm all five deployed
- Names are hyphenated (`submit-deposit`), matching `src/lib/*.js`

**Deposit button does nothing**
- Almost always the deposit method is inactive or still the placeholder (Step 6)

**Notification bell never updates**
- Migration `20260801000004` wasn't run (Step 3)

---

## Security notes

- `RESEND_API_KEY` lives only in Supabase secrets. It is never in `VITE_*`
  vars, never in the bundle, never in git.
- `.supabase-secrets.local.sh` holds the service-role key for the verifier
  scripts. Gitignored. **Delete it and rotate both keys when we're done.**
- `verify_jwt = true` on all five functions (`supabase/config.toml`), so
  unauthenticated POSTs are rejected before your code runs.

---

## Making someone an admin

Roles live in `profiles.role`. A user **cannot** promote themselves — the
`guard_profile_privileges` trigger blocks any non-admin from changing that
column, and RLS stops them touching anyone else's row. So this has to be done
with the service key, outside the app.

**They must sign up through the app first.** The script needs an existing
profile row.

```bash
source .supabase-secrets.local.sh

node supabase/make-admin.mjs --list                    # who's an admin now
node supabase/make-admin.mjs you@example.com           # promote
node supabase/make-admin.mjs someone@example.com --revoke   # demote
```

After promoting, **sign out and back in** — `useAuth` reads the profile at
session start, so an open tab keeps the old role until it re-reads. Then
visit `/admin`.

The script refuses to demote the last remaining admin, which would lock
everyone out of the console.

No terminal? Dashboard → SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

---

## The Investor Letter (newsletter)

Migration `20260801000006_newsletter.sql`, table `newsletter_subscribers`.

**Two entry points**, one list:
- Landing page footer — works logged out
- Dashboard → Account → Preferences → *Investor Letter* toggle

Subscribing goes through the `subscribe_to_newsletter` RPC rather than a direct
insert, so re-subscribing an existing address succeeds quietly instead of
erroring on the unique index. Addresses are stored lowercased with a
case-insensitive unique index, so `Bright@x.com` and `bright@x.com` are one
person.

If someone subscribes as a visitor and later signs up with the same address, a
trigger links the existing subscription to their new account — so the dashboard
toggle reflects reality rather than showing them as unsubscribed.

**The list is write-only to the public.** Anyone may subscribe; nobody without
admin can read it back. A public form that also leaks its subscriber list is a
breach, not a feature — `verify-newsletter.mjs` asserts this directly.

### Sending an issue

Not built. The list and preferences exist; there's no compose-and-send yet.
When you want it, the pieces are:

1. An admin screen to write the issue
2. An Edge Function that reads `status = 'subscribed'` and batches through
   Resend (their API takes up to 50 recipients per call)
3. An unsubscribe link — `unsubscribe_token` is already on every row for this,
   so it works without signing in

Ask and I'll build it.

---

## Investor management (admin console)

Admin → **Investors** → click any row. Four panes:

| Pane | What it does |
|---|---|
| **Overview** | Balances, credit them (to a plan or straight to balance), close investments |
| **Records** | Every deposit, withdrawal and investment — each editable and deletable. Plus recent admin history |
| **Email** | Send a custom email to that investor, in the Keelstone template |
| **Manage** | Edit name, override KYC status, promote/demote, delete the account |

### Everything is audited

Migration `20260801000007` adds `admin_audit_log`. Triggers on `deposits`,
`withdrawals`, `investments` and `profiles` record every admin edit and delete
with a **before/after snapshot** and who did it.

This matters: free-form editing of balances is exactly the thing a client might
later dispute. Investor-initiated writes are skipped so the log stays readable —
only admin actions land there.

Deleting an investor snapshots their entire record set *before* removing it. If
the audit write fails, the deletion is refused — an untraceable deletion of
financial records is worse than a failed one.

The log is admin-only and has no INSERT/UPDATE/DELETE policy for anyone: the
only writer is a SECURITY DEFINER function, so it cannot be tampered with
through the API.

### Guardrails

- Deleting anything asks you to **type to confirm** — the investor's email for
  an account, `delete` for a record
- An admin **cannot delete themselves**
- An admin **cannot delete another admin** — demote them first
- Investors still cannot edit or delete any record; those policies are unchanged
  and `verify-admin-crud.mjs` asserts it

### Deleting an investor

Removes the auth account and cascades to profile, deposits, investments,
withdrawals and KYC. Goes through the `admin-delete-user` Edge Function because
removing an `auth.users` row needs the service role — no RLS policy can grant it.

```bash
source .supabase-secrets.local.sh && node supabase/verify-admin-crud.mjs
```

18 checks: editing, auditing, cascade deletion, and every guardrail above.

---

## Email design

All templates live in `supabase/functions/_shared/email.ts` — one `layout()`
shell, so every email looks the same and a change lands everywhere at once.

### The logo

Hosted in a public Supabase Storage bucket:

```
https://ieimrautxzihehjooqks.supabase.co/storage/v1/object/public/brand/keelstone-mark.png
```

Not inlined as base64 — Gmail clips messages over ~102KB and both Gmail and
Outlook block `data:` URIs outright. Not hotlinked from `keelstone-trust.com`
either: the domain's DNS is configured for mail but isn't serving static files.

The logo sits beside a text wordmark, so when a client blocks images (Outlook's
default) the email still reads as Keelstone rather than showing a broken icon.

To replace it, upload over the same path:

```bash
source .supabase-secrets.local.sh
node -e "const fs=require('fs');fetch(process.env.SUPABASE_URL+'/storage/v1/object/brand/keelstone-mark.png',{method:'POST',headers:{apikey:process.env.SUPABASE_SECRET_KEY,Authorization:'Bearer '+process.env.SUPABASE_SECRET_KEY,'Content-Type':'image/png','x-upsert':'true'},body:fs.readFileSync('public/uploads/kneelstone-mark.png')}).then(r=>console.log(r.status))"
```

### Palette

Taken from the logo — a green shield. The previous templates were purple
(`#6d28d9`), left over from the old Lumen branding, which clashed with it.

| | |
|---|---|
| `#137045` | brand green — passes AA on white at body size |
| `#0f1b16` | headings |
| `#3d4c45` | body text |
| `#6b7d73` | secondary |
| `#f4f7f5` | canvas behind the card |

### Why the markup looks dated

Email HTML is not web HTML:

- **Tables, not flexbox or grid.** Outlook renders through Word and ignores
  modern layout CSS entirely.
- **Inline styles only.** `<style>` blocks get stripped by webmail sanitisers.
- **A plain-text part on every send.** Without one, spam filters score you
  worse and text-only clients show nothing. `sendMail()` derives it from the
  HTML when a caller doesn't supply one.
- **An explicit preheader** — the grey preview line after the subject. Left
  unset, clients scrape the first visible text, which is usually alt text.

### Building blocks

`layout()` takes a `preheader`, `heading`, `body`, optional `cta` and
`footnote`. Compose the body from:

| Helper | Use |
|---|---|
| `p(html)` | paragraph |
| `greet(firstName)` | "Hello X," with a sensible fallback |
| `statement(label, value)` | pulls an amount out of the prose |
| `details([[k, v, mono?]])` | key/value rows |
| `steps([[title, text]])` | numbered actions |
| `callout(text, tone)` | warning or error inline |

### Previewing a change

```bash
cd supabase/functions
npx deno@2 run --allow-env --allow-write - <<'EOF'
import { welcomeEmail } from './_shared/email.ts'
await Deno.writeTextFile('preview.html', welcomeEmail('Bright'))
EOF
```

Then open `preview.html`. Redeploy with `npx supabase functions deploy` — the
templates are bundled into every function, so all six need redeploying when
`email.ts` changes.
