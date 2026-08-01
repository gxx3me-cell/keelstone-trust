// Shared request plumbing: CORS, caller identity, admin checks, JSON replies.
//
// Two clients, deliberately distinct:
//   userClient  — carries the caller's JWT, subject to RLS. Use it to answer
//                 "who is this and what may they see".
//   adminClient — service role, bypasses RLS. Use it ONLY after validating,
//                 for writes the caller is not permitted to make directly
//                 (e.g. inserting a deposit row).
//
// Never pass unvalidated user input to adminClient: it has no safety net.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

export const preflight = () => new Response('ok', { headers: corsHeaders })

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

export type Caller = {
  id: string
  email: string | null
  profile: Record<string, unknown> | null
  isAdmin: boolean
}

/**
 * Resolve who is calling from the Authorization header.
 * Returns null when there is no valid session — callers should 401.
 */
export async function getCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  )

  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) return null

  // Role is read server-side from profiles — never trusted from the JWT's
  // user_metadata, which the user can edit themselves.
  const admin = adminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    profile: profile ?? null,
    isAdmin: profile?.role === 'admin',
  }
}

/** Best-effort display name for a profile row. */
export function displayName(profile: Record<string, any> | null, fallbackEmail?: string | null) {
  if (!profile) return fallbackEmail ?? 'Investor'
  return (
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email ||
    fallbackEmail ||
    'Investor'
  )
}

export const firstNameOf = (profile: Record<string, any> | null) =>
  (profile?.first_name || String(profile?.full_name ?? '').split(' ')[0] || '').trim()

/** Every admin's email address, for notifications. */
export async function adminEmails(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from('profiles').select('email').eq('role', 'admin')
  return (data ?? []).map((r: { email: string | null }) => r.email).filter(Boolean) as string[]
}
