import { useEffect, useState } from 'react'
import { db } from '../lib/cocobase'

/**
 * Resolves the current CocoBase session on mount.
 * Returns { user, loading, isAuthenticated, isAdmin }.
 * Admin status is checked with db.auth.hasRole('admin').
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    db.auth
      .initAuth()
      .then(({ user: u, isAuthenticated }) => {
        if (!active) return
        setUser(isAuthenticated ? u ?? null : null)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: !loading && !!user && (() => { try { return db.auth.hasRole('admin') } catch { return false } })(),
  }
}

export default useAuth
