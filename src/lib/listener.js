// Client for the Lumen deposit listener (BSC/USDT BEP-20).
// The listener is a long-running server (see Desktop/lumen-listener) that:
//  - assigns each investor a unique BEP-20 deposit address
//  - watches BSC and auto-creates an investment when USDT arrives
//  - sends USDT out for approved withdrawals
//
// Configure via .env:
//   VITE_LISTENER_URL=https://your-listener-host
//   VITE_LISTENER_SECRET=<same API_SECRET as the listener .env>

const LISTENER_URL = import.meta.env.VITE_LISTENER_URL || 'http://localhost:3001'
const LISTENER_SECRET = import.meta.env.VITE_LISTENER_SECRET || ''

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${LISTENER_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': LISTENER_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail = `Listener error (${res.status})`
    try { const j = await res.json(); detail = j.error || detail } catch {}
    throw new Error(detail)
  }
  return res.json()
}

// Create/refresh a deposit session — returns the investor's unique BEP-20 address.
// Records the chosen plan so the listener builds the right investment on arrival.
export function createDepositSession({ userId, userEmail, userName, plan }) {
  return call('/sessions', {
    method: 'POST',
    body: {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      plan_id: plan?.id,
      plan_name: plan?.name,
      annual_return_pct: plan?.annual_return_pct ?? 0,
    },
  })
}

// Ask the listener to scan the chain now (manual "I've paid" trigger).
export function checkPayment(userId) {
  return call(`/check/${userId}`, { method: 'POST' })
}

// Admin: owner-wallet treasury balance (USDT + BNB).
export function getTreasuryBalance() {
  return call('/treasury-balance')
}

// Admin: send an approved withdrawal on-chain (USDT BEP-20) to the user's address.
export function sendWithdrawal({ toAddress, amount }) {
  return call('/send-withdrawal', {
    method: 'POST',
    body: { to_address: toAddress, amount },
  })
}

// Listener health/uptime.
export function getListenerHealth() {
  return call('/health')
}

export const LISTENER_CONFIGURED = !!LISTENER_SECRET
