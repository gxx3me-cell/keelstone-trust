# ChainFlow payments — setup

Crypto deposits and payouts run through [ChainFlow](https://chainflow-dashboard.vercel.app/docs)
(USDT, BEP-20 on BNB Smart Chain). Everything server-side lives in CocoBase cloud
functions, so **no key ever reaches the browser** and there is nothing to self-host.

## What's already built

| Cloud function | Does |
|---|---|
| `chainflow-wallet` | Investor picks a plan → returns their unique USDT deposit address (`POST /v1/wallets`) and records which plan they're funding |
| `chainflow-webhook` | ChainFlow calls this when a payment confirms → verifies the HMAC signature, then creates the investor's deposit + active investment. Idempotent (a replayed tx can't double-credit) |
| `chainflow-payout` | Admin approves a withdrawal → sends USDT out (`POST /v1/payouts`) |

## What you need to do

### 1. Add your ChainFlow API key

Get a secret key (`sk_live_…`) from the ChainFlow dashboard, then set it on the
**CocoBase project config** as `chainflow_api_key`. Both functions read it from
config first, so you can rotate the key without touching code.

Alternatively, edit the `CHAINFLOW_API_KEY` constant at the top of
`chainflow-wallet` and `chainflow-payout` in the CocoBase dashboard.

### 2. Connect the webhook

In the ChainFlow dashboard, set your project's webhook URL to:

```
https://cloud.cocobase.cc/functions/ad5ea768-2c32-4f9d-a296-8050e0e96b61/func/chainflow-webhook
```

Then take the **webhook secret** ChainFlow gives you and set it on the CocoBase
project config as `chainflow_webhook_secret` (or replace the
`CHAINFLOW_WEBHOOK_SECRET` constant in `chainflow-webhook`).

> The webhook **fails closed** — until the secret is set it returns
> `500 Webhook secret not configured` and credits nothing.

### 3. Activate payouts

Withdrawals need payouts enabled: ChainFlow dashboard → **Balances & Payouts** →
*Activate payouts*. Until then `POST /v1/payouts` is rejected.

## How the money flows

**Deposit**
1. Investor picks a plan and clicks through the deposit modal
2. `chainflow-wallet` returns their unique BEP-20 address (same address every time)
3. They send USDT; ChainFlow watches the chain
4. On confirmation ChainFlow POSTs `payment.confirmed` to our webhook
5. `chainflow-webhook` verifies the signature and activates their investment — it starts earning immediately

**Withdrawal**
1. Investor submits a withdrawal request with their BEP-20 address (`submit-withdrawal`)
2. Admin approves it in the admin dashboard
3. `chainflow-payout` sends the USDT, and only then is the request marked approved

## Verified behaviour

The webhook was tested end-to-end against the real deployed function:

- Valid signature → payment credited ✅
- Tampered signature → `401 Invalid signature` ✅
- Replayed transaction → `duplicate: true`, no double-credit ✅
- No secret configured → refuses to run ✅

## Notes

- ChainFlow charges **0.4% per payment**, taken when funds sweep to your master
  wallet. Payouts are free. Who absorbs the fee is a ChainFlow dashboard setting.
- Only `payment.confirmed` credits an investment. `payment.detected` and
  `payment.swept` are acknowledged and ignored.
- ChainFlow has **test mode** — test links are signed identically but carry
  `livemode: false`, so point test events at a separate URL if you use it.
