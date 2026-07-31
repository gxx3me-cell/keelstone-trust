# Deposits — setup

Deposits are **manual and admin-confirmed**. An admin publishes the wallets
investors should send funds to; investors send the funds themselves and file a
request; nothing is credited until an admin approves it.

There is no payment processor and no webhook — the admin is the source of truth.

## The flow

**Investor**
1. Opens *Fund Portfolio* and enters an amount
2. Chooses where it goes — an investment plan, or just their available balance
3. Picks a deposit method (BTC, ETH, USDT…) and copies the wallet address
4. Sends the funds from their own wallet or exchange
5. Clicks **I have made the deposit**, optionally pasting a tx hash / reference
6. The amount immediately shows as **pending** on their dashboard

**Admin**
1. Gets an email the moment a request is filed
2. Verifies the funds actually arrived
3. Approves (or rejects) it under **Deposits** in the admin console
4. On approval: a plan-linked deposit becomes an active investment that starts
   earning; a balance deposit becomes spendable balance
5. The investor is emailed either way

## Cloud functions

Deploy each file in `cloud-functions/` to CocoBase under its own filename.
**Function names use underscores** — the deployed name must match the filename
exactly or `db.functions.execute` will 404.

| Function | Does |
|---|---|
| `deposit_methods` | List / create / update / delete the wallets investors deposit to. `action: "list"` is investor-facing (active methods only); `admin_list`, `save`, `delete` are admin-only |
| `submit_deposit` | Files a **pending** deposit request and emails every admin. Credits nothing |
| `admin_action` | Approve / reject a deposit or withdrawal. Approving a plan-linked deposit is what opens the investment. Emails the investor |
| `get_my_portfolio` | Everything the investor dashboard renders, including `pending_total` and `available_balance` |
| `send_welcome_email` | Sent once at signup. Walks the new investor through verify → KYC → first deposit. Idempotent via `data.welcome_email_sent_at` |
| `request_password_reset` / `complete_password_reset` | Password reset (unrelated to deposits) |

Functions still deployed under hyphenated names and **not** in this repo:
`admin_fund`, `submit_withdrawal`, `support_email`. The frontend now calls these
with underscores too — rename them in the CocoBase dashboard to match.

## Collections

### `lumen_deposit_methods`
The wallets shown to investors. Managed entirely from **Admin → Deposit Methods**.

| Field | Notes |
|---|---|
| `name` | "Bitcoin" — what the investor picks |
| `symbol` | "BTC" |
| `network` | "Bitcoin mainnet" — shown as a loud warning on the pay screen |
| `wallet_address` | What the investor copies |
| `instructions` | Free text shown under the address |
| `min_amount` | `0` = no minimum |
| `active` | Hidden from investors when false |
| `sort_order` | Display order |

### `lumen_deposits`
Written by `submit-deposit`. Key fields: `user_id`, `amount`, `status`
(`pending` / `approved` / `rejected`), `method`, `method_id`, `wallet_address`,
`plan_id` (null = to balance), `plan_name`, `reference`, `tx_hash`, `admin_note`.

A deposit with `plan_id` set gets `allocated: true` when approved, so the
balance calculation doesn't double-count money that became an investment.

## Configuration

Set on the CocoBase project config:

- `site_url` — used for links in admin and investor emails
  (e.g. `https://keelstone-trust.com`). Defaults to that domain.

## Before going live

Investors **cannot deposit until at least one deposit method exists**. The admin
overview and the deposit modal both warn about this. Add one under
**Admin → Deposit Methods**.

## Onboarding & KYC

`send_welcome_email` fires from the signup page and pushes three steps: verify
email → complete KYC → make a first deposit. The dashboard shows a matching
checklist card so the two stay in sync, and it disappears once all three are done.

**KYC is not implemented yet.** There is no document upload and no review queue.
The dashboard reads `user.data.kyc_status` (`approved` / `pending` / `rejected`,
anything else = not started) and the Settings panel currently routes investors to
email an advisor. To finish it you need:

1. A document upload surface writing to a `lumen_kyc` collection
2. An admin review screen that sets `kyc_status` on the user record
3. Optionally, gating deposits on `kyc_status === 'approved'`

Until then nothing sets `kyc_status`, so every account shows *Not started* — which
is honest. Previously the dashboard hardcoded "✓ Verified" for everyone; that was
removed.

## Withdrawals

Withdrawals are manual too. The investor submits a request with their wallet
address; approving it in the admin console **only records the payout** — an
admin sends the funds by hand first. The console asks for confirmation of this
before approving.
