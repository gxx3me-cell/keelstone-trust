import { createClient } from '@supabase/supabase-js'

// The publishable key is safe in the browser: on its own it grants nothing.
// Row Level Security on every table decides what the signed-in user may read
// or write. If RLS is ever disabled on a table, this key becomes a full
// read/write key to it — so RLS is not optional here, it is the security model.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  )
}

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for email confirm + password recovery links
  },
})

export default supabase
