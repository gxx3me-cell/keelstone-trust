// Admin notification feed.
//
// Rows are written by database triggers (see 20260801000003_notifications.sql),
// never by the client — a signup happens with no session at all, and a deposit
// status change must be recorded whether or not a browser is watching.
//
// Read state is per-admin and lives in `notification_reads`, so it follows the
// admin between devices instead of sitting in one browser's localStorage.
// `notifications_for_me` joins the two and exposes `is_read` for the caller.

import { supabase } from './supabase'

export const KINDS = {
  user: { label: 'New investor', icon: 'user', tone: 'brand' },
  deposit: { label: 'Deposit', icon: 'down', tone: 'gain' },
  withdrawal: { label: 'Withdrawal', icon: 'up', tone: 'warn' },
  message: { label: 'Message', icon: 'mail', tone: 'info' },
  investment: { label: 'Investment', icon: 'chart', tone: 'gain' },
  kyc: { label: 'KYC', icon: 'shield', tone: 'info' },
}

export const KIND_FILTERS = [
  ['all', 'All'],
  ['deposit', 'Deposits'],
  ['withdrawal', 'Withdrawals'],
  ['user', 'Investors'],
  ['kyc', 'KYC'],
  ['message', 'Messages'],
]

// A pending item is something the admin still has to act on.
const PENDING_TITLES = new Set([
  'Deposit awaiting approval',
  'Withdrawal requested',
  'KYC submitted for review',
])

/** Normalise a row into the shape the UI renders. */
function mapRow(row) {
  const kind = KINDS[row.kind] || KINDS.message
  const actionable = PENDING_TITLES.has(row.title)
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body || '',
    actor: row.actor_email || null,
    actorId: row.actor_id || null,
    amount: row.amount == null ? null : Number(row.amount),
    at: row.created_at,
    entityId: row.entity_id || null,
    isRead: !!row.is_read,
    tone: actionable ? 'warn' : kind.tone,
    actionable,
  }
}

/**
 * The admin feed, newest first.
 * Reads the view so each admin gets their own `is_read`.
 */
export async function fetchNotifications({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('notifications_for_me')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

/** Mark specific notifications read for the signed-in admin. */
export async function markRead(ids) {
  const list = [].concat(ids).filter(Boolean)
  if (!list.length) return
  const { data: auth } = await supabase.auth.getUser()
  const adminId = auth?.user?.id
  if (!adminId) return

  const { error } = await supabase
    .from('notification_reads')
    .upsert(
      list.map((notification_id) => ({ notification_id, admin_id: adminId })),
      { onConflict: 'notification_id,admin_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(error.message)
}

export async function markAllRead(notifications) {
  await markRead(notifications.filter((n) => !n.isRead).map((n) => n.id))
}

export const unreadCount = (notifications) =>
  notifications.reduce((n, x) => (x.isRead ? n : n + 1), 0)

/**
 * Live updates. Postgres changes only fire for rows the caller may read, so
 * this is admin-only by construction. Returns an unsubscribe function.
 */
export function subscribeToNotifications(onInsert) {
  const channel = supabase
    .channel('admin-notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => onInsert(mapRow({ ...payload.new, is_read: false })),
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
