# Supabase runbook

Project: `ieimrautxzihehjooqks`

## Status

| | |
|---|---|
| Schema + RLS | ✅ applied and verified (16/16 checks) |
| Plans | ✅ 4 seeded (Conservative, Balanced, Growth, Private Mandate) |
| Deposit method | ⚠️ 1 placeholder, **inactive** — set a real address before launch |
| Frontend | ✅ fully ported, CocoBase removed, build passes |
| KYC migration | ⛔ **needs running** — see below |
| Edge Functions | ⛔ **not written** — deposits cannot be filed until they are |

---

## 1. Run the KYC migration

SQL Editor → paste and run `supabase/migrations/20260801000002_kyc.sql`.

Then verify:

```bash
source .supabase-secrets.local.sh && node supabase/verify-kyc.mjs
```

That checks the table, that the bucket is private, that the status trigger
fires, and — most importantly — that an investor cannot file KYC as someone
else, self-approve, or upload into another user's folder.

## 2. Make yourself an admin

Sign up through the app first, then in the SQL editor:

```sql
update public.profiles set role = 'admin'
where email = 'ejikemebright661@gmail.com';
```

A trigger blocks users changing their own role, so this only works from the SQL
editor — not from the app.

## 3. Auth settings

**Authentication → URL Configuration**
- Site URL: your deployed URL
- Redirect URLs: add `http://localhost:5173/**` for local dev

Password reset and email confirmation both break without these.

**Authentication → Email Templates** — customise Confirm Signup and Reset
Password wording.

**Authentication → Providers → Email** — "Confirm email" is ON. Signup handles
this correctly (shows a "check your email" screen). Turning it off lets anyone
register with an address they don't own.

## 4. Vercel

Environment variables:

```
VITE_SUPABASE_URL=https://ieimrautxzihehjooqks.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_7phkrZFFtHWaLNH-tnoonw_nRukdOPp
```

## 5. Edge Functions — deposits do not work without these

`submit-deposit` and `admin-action` are **required**. There is deliberately no
INSERT policy on `deposits` for investors: a user who could insert their own row
could credit themselves any amount. So the deposit button will fail until
`submit-deposit` exists.

Old Python implementations are in
`supabase/functions/_reference-cocobase-python/` — business rules and email HTML
are reusable, but they must be rewritten in Deno/TypeScript.

Email also needs a provider (Resend or similar); `req.send_mail` has no Supabase
equivalent.

```bash
supabase login
supabase link --project-ref ieimrautxzihehjooqks
supabase functions new submit-deposit
supabase functions deploy submit-deposit
supabase secrets set RESEND_API_KEY=... SITE_URL=https://keelstone-trust.com
```

Every function that moves money must re-verify the caller server-side — see
section 4 of the pattern in the reference README.

---

## Re-running verification

```bash
source .supabase-secrets.local.sh && node supabase/verify.mjs      # schema + RLS
source .supabase-secrets.local.sh && node supabase/verify-kyc.mjs  # KYC
```

Both create throwaway users and delete them afterwards.

## Notes

- `numeric` columns come back as **strings**. `Number()` them before arithmetic
  — `getMyPortfolio()` already does this.
- The old CocoBase key was committed in `src/lib/cocobase.js` and `.mcp.json`.
  Both are gone now, but it remains in git history — revoke it in CocoBase.
- `.supabase-secrets.local.sh` holds the secret + service-role keys for these
  scripts. It is gitignored. **Delete it and rotate both keys when finished.**
