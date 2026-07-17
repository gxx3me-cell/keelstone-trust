// ChainFlow payments, accessed through CocoBase cloud functions.
//
// The ChainFlow secret key never touches the browser — it lives in the cloud
// functions (chainflow-wallet / chainflow-payout). Deposits are credited by
// ChainFlow calling our signed webhook (chainflow-webhook), so there is no
// polling and nothing to self-host.
import { db } from './cocobase'

// Unwrap the cloud-function envelope: execute() may return the result directly
// or wrapped in { result }. Errors come back as { error }.
function unwrap(res) {
  const r = res?.result ?? res
  if (r?.error) throw new Error(r.error)
  return r
}

// Create a ChainFlow payment intent for a plan + amount and get the hosted
// checkout URL. The investor is sent to that page (amount, address, QR, live
// status). On confirmation ChainFlow fires our webhook and the investment
// activates. Returns { intent_id, checkout_url, address, amount, currency, expires_at }.
export async function createCheckout({ plan, amount }) {
  const res = await db.functions.execute('chainflow-intent', {
    payload: { plan_id: plan?.id, amount },
    method: 'POST',
  })
  return unwrap(res)
}

// Get this investor's unique USDT (BEP-20) deposit address for a given plan
// (raw-address flow — kept for reference; the modal uses createCheckout instead).
export async function getDepositAddress(plan) {
  const res = await db.functions.execute('chainflow-wallet', {
    payload: { plan_id: plan?.id },
    method: 'POST',
  })
  return unwrap(res)
}

// Admin: pay an approved withdrawal out to the investor's wallet.
export async function sendPayout({ toAddress, amount, token = 'USDT' }) {
  const res = await db.functions.execute('chainflow-payout', {
    payload: { to_address: toAddress, amount, token },
    method: 'POST',
  })
  return unwrap(res)
}
