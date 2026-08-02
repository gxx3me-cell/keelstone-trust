// The Keelstone Trust Investor Letter — subscription handling.
//
// Subscribing goes through a SECURITY DEFINER RPC rather than a direct insert,
// so re-subscribing an existing address succeeds quietly instead of erroring on
// the unique index — and so the caller never learns whether an address was
// already on the list.
import { supabase } from './supabase'

/** Subscribe an address. Safe to call repeatedly. */
export async function subscribe(email, source = 'landing') {
  const clean = String(email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    throw new Error('Please enter a valid email address.')
  }
  const { error } = await supabase.rpc('subscribe_to_newsletter', {
    p_email: clean,
    p_source: source,
  })
  if (error) throw new Error(error.message)
  return clean
}

/** Unsubscribe the signed-in investor. */
export async function unsubscribe() {
  const { error } = await supabase.rpc('unsubscribe_from_newsletter')
  if (error) throw new Error(error.message)
}

/**
 * Is the signed-in investor subscribed?
 *
 * Scoped to the caller explicitly rather than leaning on RLS: admins can read
 * the whole subscriber list, so an unfiltered maybeSingle() would either throw
 * on multiple rows or hand back somebody else's record.
 */
export async function getMySubscription() {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('status, subscribed_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

/** Admin: the whole list. RLS returns nothing to non-admins. */
export async function listSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
