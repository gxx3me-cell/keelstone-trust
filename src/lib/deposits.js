// Manual deposit flow, through CocoBase cloud functions.
//
// Investors deposit by sending funds to one of the wallet addresses an admin
// publishes, then filing a request. Nothing is credited automatically — an
// admin verifies the transfer and approves it in the admin console.
import { db } from './cocobase'

// Unwrap the cloud-function envelope: execute() may return the result directly
// or wrapped in { result }. Errors come back as { error }.
function unwrap(res) {
  const r = res?.result ?? res
  if (r?.error) throw new Error(r.error)
  return r
}

async function call(name, payload) {
  return unwrap(await db.functions.execute(name, { payload, method: 'POST' }))
}

// Active deposit methods for the investor-facing picker.
export async function listDepositMethods() {
  const r = await call('deposit_methods', { action: 'list' })
  return r?.methods ?? []
}

// Every deposit method, including hidden ones. Admin only.
export async function listAllDepositMethods() {
  const r = await call('deposit_methods', { action: 'admin_list' })
  return r?.methods ?? []
}

// Create (omit id) or update (pass id) a deposit method. Admin only.
export async function saveDepositMethod(method) {
  return call('deposit_methods', { action: 'save', ...method })
}

// Admin only.
export async function deleteDepositMethod(id) {
  return call('deposit_methods', { action: 'delete', id })
}

// File a pending deposit request. `planId` is optional — without it the funds
// land in the investor's general balance once approved.
export async function submitDeposit({ amount, methodId, planId, reference }) {
  return call('submit_deposit', {
    amount: String(amount),
    method_id: methodId,
    plan_id: planId || null,
    reference: reference || '',
  })
}
