import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Resolves the Supabase session and the matching profile row.
 * Returns { user, profile, loading, isAuthenticated, isAdmin, emailVerified, refresh }.
 *
 * Unlike the previous CocoBase hook this subscribes to auth changes rather
 * than reading once on mount — Supabase refreshes tokens in the background and
 * pushes sign-in/sign-out events, including from other tabs.
 *
 * `refresh()` re-reads the profile row — needed after a write that changes it
 * (e.g. a KYC submission) so the UI reflects it without a reload.
 *
 * `isAdmin` comes from profiles.role, never from user_metadata: metadata is
 * editable by the user themselves and is therefore unsafe for authorization.
 * The server enforces this independently through RLS — this flag only decides
 * what the UI bothers to render.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    // maybeSingle() returns null rather than throwing when the row is missing,
    // which happens briefly if the signup trigger hasn't committed yet.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return error ? null : data
  }, [])

  useEffect(() => {
    let active = true

    const resolve = async (session) => {
      const nextUser = session?.user ?? null
      if (!active) return
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const p = await fetchProfile(nextUser.id)
      if (!active) return
      setProfile(p)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    const u = data?.user ?? null
    if (!u) return null
    setUser(u)
    const p = await fetchProfile(u.id)
    setProfile(p)
    return p
  }, [fetchProfile])

  return {
    user,
    profile,
    setProfile,
    refresh,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    emailVerified: !!user?.email_confirmed_at,
  }
}

export default useAuth
