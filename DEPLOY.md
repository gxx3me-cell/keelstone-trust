# Deploy — your GitHub, your Vercel, your domain

Everything is committed and the production build passes. Four steps, ~15 min
of work plus DNS wait.

**Important:** this is a **Vite + React** app, not Next.js. So env vars are
`VITE_*`, not `NEXT_PUBLIC_*`, and the build output is `dist/`. Vercel usually
detects this correctly — verify it says **Vite** on the import screen. good

---

## Step 1 — Push to your own GitHub

The repo currently points at **`github.com/lordace-coder/lumen`**, which is not
your account. Repoint it:

1. Create a new **private** repo on your GitHub — e.g. `keelstone-trust`.
   Don't add a README or .gitignore; the repo already has both.

2. In PowerShell, from `C:\Users\Bright\Desktop\Projects\Lumen\lumen`:

```powershell
git remote remove origin
git remote add origin https://github.com/<your-username>/keelstone-trust.git
git push -u origin main
```

If it asks to authenticate, sign in as yourself — not the other account.

**Make it private.** The repo contains your full database schema and RLS
policies. No keys (I checked), but the schema is a roadmap for anyone probing
your API.

---

## Step 2 — Vercel project

1. [vercel.com](https://vercel.com) → sign in **as yourself**
2. **Add New → Project** → import `keelstone-trust`
3. Confirm the detected settings:

| Setting | Value |
|---|---|
| Framework Preset | **Vite** |
| Build Command | `npm run build` |
| Output Directory | **`dist`** |
| Install Command | `npm install` |

4. **Before clicking Deploy**, expand **Environment Variables** and add both:

```
VITE_SUPABASE_URL
https://ieimrautxzihehjooqks.supabase.co
```

```
VITE_SUPABASE_PUBLISHABLE_KEY
sb_publishable_7phkrZFFtHWaLNH-tnoonw_nRukdOPp
```

Set both for **Production, Preview and Development**.

Miss this and the app builds fine but shows a blank screen — the Supabase
client throws on startup when the vars are absent.

5. **Deploy.** ~60–90 seconds → `https://<project>.vercel.app`

`vercel.json` already handles SPA routing, so `/dashboard` and `/admin` won't
404 on refresh.

---

## Step 3 — Test the .vercel.app URL before touching DNS

Don't skip this. Check:

- [ ] Landing page loads, four plans show
- [ ] Sign up → confirmation email arrives
- [ ] Sign in → dashboard loads
- [ ] `/admin` loads (you're already an admin)
- [ ] Newsletter form in the footer accepts an address

---

## Step 4 — Point the domain

⚠️ **Read this before changing DNS.**

`keelstone-trust.com` currently has **live mail records** for Resend — DKIM,
SPF, and the `send` MX. If you switch the registrar to Vercel's nameservers,
those are dropped and **all email stops working**: signup confirmations,
password resets, deposit notifications.

**Safest path — keep your current DNS, add records manually:**

1. Vercel project → **Settings → Domains → Add** → `keelstone-trust.com`
2. Choose the **A record / CNAME** instructions (NOT "use Vercel nameservers")
3. At your registrar, add only what Vercel asks for:
   - `A` on `@` → `76.76.21.21`
   - `CNAME` on `www` → `cname.vercel-dns.com`
4. **Leave every existing record alone** — especially:
   - `TXT` on `resend._domainkey`
   - `MX` and `TXT` on `send`
   - `TXT` on `_dmarc`

If you do move to Vercel nameservers, you must re-create all four mail records
there or email dies silently.

**Timing:** DNS usually resolves in 10–60 minutes. Vercel issues SSL
automatically once it sees the records. Test on mobile data if your browser
caches the old result.

---

## Step 5 — Update Supabase redirect URLs

Once the domain is live, Supabase needs to trust it for auth links. I've
already set:

- Site URL: `https://keelstone-trust.com`
- Redirects: `https://keelstone-trust.com/**`, `http://localhost:5173/**`

If you deploy to a different domain, tell me and I'll update it — password
reset and email confirmation links break otherwise.

---

## Still to do before real investors

**The deposit method is a placeholder.** Wallet address `0x0000…0000`, marked
inactive. Sign in → `/admin` → Deposit Methods → set a real address → activate.
Until then the deposit flow has nothing to show.

**Rotate credentials.** These are all in our chat transcript:

| Key | Where |
|---|---|
| Supabase secret + service_role | Dashboard → Settings → API Keys |
| Supabase access token | supabase.com/dashboard/account/tokens |
| Resend API key | resend.com → API Keys |

The publishable key in Step 2 is safe to expose — that's its purpose. RLS is
what protects the data, and it's verified by seven test suites.

---

## Re-running the tests later

```bash
source .supabase-secrets.local.sh
node supabase/verify.mjs                # schema + RLS       16/16
node supabase/verify-kyc.mjs            # KYC + storage       7/7
node supabase/verify-notifications.mjs  # feed + realtime    12/12
node supabase/verify-newsletter.mjs     # subscriptions      12/12
node supabase/verify-functions.mjs      # deposits e2e       26/26
node supabase/verify-admin-crud.mjs     # admin edit/delete  18/18
node supabase/verify-withdrawals.mjs    # withdrawals        17/17
```

They occasionally fail on a network blip — rerun before assuming a regression.
finally done
