# Reference only — not deployed

These are the old CocoBase cloud functions, kept because the transactional email
HTML and the business rules are worth porting rather than rewriting.

Supabase Edge Functions are Deno/TypeScript, so none of this runs as-is.

Still to port:
- `submit_deposit.py`  → `submit-deposit`   (REQUIRED before deposits work —
                          investors have no INSERT policy on `deposits` by design)
- `admin_action.py`    → `admin-action`     (REQUIRED — approving a deposit is
                          what creates the investment)
- `send_welcome_email.py` → `send-welcome-email`
- `support_email.py`   → `support-email`    (never existed here; lived only in CocoBase)
- `admin_fund.py`      → `admin-fund`       (never existed here; lived only in CocoBase)

Already replaced by Supabase built-ins — do NOT port:
- `request_password_reset.py`, `complete_password_reset.py` → `supabase.auth.resetPasswordForEmail` / `updateUser`
- `get_my_portfolio.py` → now `getMyPortfolio()` in `src/lib/deposits.js`
- `deposit_methods.py`  → now direct table reads under RLS
- `admin_kyc.py`        → now a direct RLS-guarded UPDATE in `src/lib/kyc.js`

Email needs a provider (Resend or similar) — `req.send_mail` has no Supabase
equivalent. The HTML in these files is reusable verbatim.
