# Resend + Edge Functions — setup walkthrough

## Status — 2026-08-01

| | |
|---|---|
| Migrations | ✅ all 5 applied and verified |
| RLS | ✅ 16/16 checks |
| KYC | ✅ 7/7 — guard-conflict bug fixed |
| Notifications | ✅ 12/12 including live realtime |
| Edge Functions | ✅ all 5 deployed, ACTIVE, `verify_jwt: true` |
| End-to-end deposit | ✅ 26/26 |
| Resend | ⚠️ works, but **domain still `pending`** — sandbox only |
| Deposit method | ⛔ still the `0x0000…` placeholder, inactive |

**Two things left before real investors can use this** — steps 2 and 6 below.

Everything else in this document is done. It's kept as a record of what was
configured and why.

---

## Step 1 — Resend account and API key

✅ **Done.** Key supplied and tested against the Resend API — it authenticates.

Two things I found while testing:

- The account is registered to **`gxx3me@gmail.com`**, not
  `ejikemebright661@gmail.com`. Until the domain verifies, Resend refuses to
  send anywhere except that address. Worth confirming it's the account you meant.
- `keelstone-trust.com` is added and showing **pending** — DNS still propagating.

---

## Step 2 — Verify your sending domain

This is the step people skip, and it's why their email lands in spam. Resend
will not let you send from `@keelstone-trust.com` until you prove you own it.

1. Resend → **Domains → Add Domain** → enter `keelstone-trust.com`
2. Resend shows you 3 DNS records. Add all of them wherever your DNS lives
   (Vercel, Cloudflare, Namecheap, wherever the domain is registered):

   | Type | Purpose |
   |---|---|
   | `MX` + `TXT` (SPF) | authorises Resend's servers to send as you |
   | `TXT` (DKIM) | cryptographically signs your mail |
   | `TXT` (DMARC) | tells inboxes what to do with mail that fails the above |

   Copy the values exactly. A trailing dot or a wrong subdomain silently breaks
   verification.
3. Click **Verify**. Usually a few minutes; DNS can take up to 48 hours.

### The records for keelstone-trust.com

Add these **four**:

| Type | Name | Value | Priority |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZX2cLXtVUAxgcmUqVWViAiHOHgpALbMSXHAPO7X7ZWeNHELTBjFlzRUuJpd8MNzLVzuQBYf33zyowqyonL0jlZMZk16ZixPhzBeihw0BxK1N/m2w2aDG+ZdAInNcxFbuM9JBs0l0DyTbOI4sxKRuqt/vBWdNjkWjFUQFQHEh0QQIDAQAB` | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | — |

**Skip the fifth record** Resend offers — `MX` on `@` pointing to
`inbound-smtp.eu-west-1.amazonaws.com`. That is for *receiving* mail and would
redirect **all** inbound email for the domain. `contact@keelstone-trust.com` is
published three times on the landing page and referenced in the KYC flow, so
adding it would silently stop those messages reaching wherever they go now.
Nothing in the app needs inbound mail — the support inbox is written by the
admin console, not by receiving email. Verification passes without it.

`p=none` on DMARC means monitor-only; tighten to `p=quarantine` after a few
weeks of clean sending.

**Don't have the domain ready?** You can test with Resend's sandbox sender
`onboarding@resend.dev`, but it will *only* deliver to the account owner's
address (`gxx3me@gmail.com`). Fine for a smoke test, useless for real investors.

**How to tell it worked:** the domain shows **Verified** with a green tick.

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

All five are deployed and ACTIVE with `verify_jwt: true`. Secrets set:
`RESEND_API_KEY`, `SITE_URL`, `EMAIL_FROM`.

`EMAIL_FROM` is currently the **sandbox sender** `onboarding@resend.dev`,
because the domain hasn't verified yet. Once it does, update it — no redeploy
needed, secrets are read at invocation:

```powershell
npx supabase secrets set "EMAIL_FROM=Keelstone Trust <noreply@keelstone-trust.com>"
```

Or ask me and I'll do it through the Management API.

To redeploy after changing function code:

```powershell
npx supabase functions deploy
```

Verified end to end with `node supabase/verify-functions.mjs` — 26/26, covering
the happy path and the attacks: forged `status: 'approved'` ignored, forged
`user_id` ignored, non-admin approval refused, double-approval refused.

## Step 5 — Auth email templates

Supabase's own auth emails (confirm signup, password reset) do **not** go through
Resend by default — they use Supabase's built-in sender, which is rate-limited
and generic-looking.

**Minimum:** Dashboard → **Authentication → Email Templates** → reword *Confirm
signup* and *Reset password* to sound like Keelstone.

**Better (later):** Authentication → **SMTP Settings** → point Supabase at Resend
so every email, including auth, comes from your verified domain:

- Host `smtp.resend.com`, Port `465`
- Username `resend`
- Password: your `re_` API key
- Sender: `noreply@keelstone-trust.com`

Also set **Authentication → URL Configuration**:
- Site URL: your deployed URL
- Redirect URLs: add `http://localhost:5173/**` for local dev

Password reset and email confirmation both break without these.

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
