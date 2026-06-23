import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../lib/cocobase'
import { useAuth } from '../hooks/useAuth'

const serif = "'DM Serif Display',serif"

const card = (pad = 26) => ({
  background: '#fff',
  border: '1px solid #ece4fb',
  borderRadius: 22,
  padding: pad,
  boxShadow: '0 18px 40px rgba(124,58,237,.08)',
})

function initials(user) {
  const name = user?.data?.full_name || user?.data?.first_name || user?.email || '?'
  return name.trim().slice(0, 2).toUpperCase()
}

function displayName(user) {
  return (
    user?.data?.full_name ||
    [user?.data?.first_name, user?.data?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Unknown'
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, isAdmin } = useAuth()

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')

  // Load the user list once we've confirmed the viewer is an admin.
  useEffect(() => {
    if (loading || !isAdmin) return
    let active = true
    setListLoading(true)
    db.auth
      .listUsers({ limit: 50 })
      .then((res) => {
        if (!active) return
        setUsers(res?.data ?? [])
        setTotal(res?.total ?? res?.data?.length ?? 0)
      })
      .catch((err) => {
        if (active) setListError(err?.message || 'Failed to load users.')
      })
      .finally(() => {
        if (active) setListLoading(false)
      })
    return () => {
      active = false
    }
  }, [loading, isAdmin])

  const handleSignOut = async () => {
    db.auth.logout()
    navigate('/login')
  }

  // ── Resolving session ──────────────────────────────────────────
  if (loading) {
    return (
      <Centered>
        <div style={{ fontFamily: serif, fontSize: 22, color: '#221a33' }}>Verifying access…</div>
      </Centered>
    )
  }

  // ── Not signed in ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Centered>
        <div style={card(34)}>
          <div style={{ fontFamily: serif, fontSize: 28, color: '#221a33', marginBottom: 8 }}>Sign in required</div>
          <p style={{ color: '#8a7fa3', fontSize: 15, margin: '0 0 22px', maxWidth: 360 }}>
            You need to be signed in to view the admin console.
          </p>
          <Link to="/login" style={primaryLink}>Go to sign in</Link>
        </div>
      </Centered>
    )
  }

  // ── Signed in but not an admin ─────────────────────────────────
  if (!isAdmin) {
    return (
      <Centered>
        <div style={card(34)}>
          <div style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ef4444', fontWeight: 800, marginBottom: 12 }}>403 · Restricted</div>
          <div style={{ fontFamily: serif, fontSize: 28, color: '#221a33', marginBottom: 8 }}>Admins only</div>
          <p style={{ color: '#8a7fa3', fontSize: 15, margin: '0 0 22px', maxWidth: 380 }}>
            Your account ({user?.email}) doesn’t have the <strong>admin</strong> role. Contact a platform
            owner if you believe this is a mistake.
          </p>
          <Link to="/dashboard" style={primaryLink}>Back to my dashboard</Link>
        </div>
      </Centered>
    )
  }

  // ── Admin view ─────────────────────────────────────────────────
  const adminCount = users.filter((u) => (u.roles || []).includes('admin')).length

  const stats = [
    { label: 'Total users', val: total || users.length },
    { label: 'Administrators', val: adminCount },
    { label: 'Standard accounts', val: Math.max((total || users.length) - adminCount, 0) },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#faf7ff', padding: '0 0 60px' }}>
      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px clamp(20px,4vw,52px)', borderBottom: '1px solid #ece4fb', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(124,58,237,.36)' }}>
            <div style={{ width: 13, height: 13, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 22, color: '#221a33' }}>Lumen</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,.1)', padding: '4px 9px', borderRadius: 999, marginLeft: 4 }}>Admin</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link to="/dashboard" style={{ fontSize: 14, fontWeight: 700, color: '#8a7fa3', textDecoration: 'none' }}>Client view →</Link>
        <button type="button" onClick={handleSignOut} style={{ padding: '10px 16px', borderRadius: 11, border: '1px solid #ece4fb', background: '#fff', color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 clamp(20px,4vw,52px)' }}>
        <div style={{ padding: '34px 0 26px' }}>
          <div style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 10 }}>Admin console</div>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(28px,3.4vw,40px)', margin: 0, color: '#221a33' }}>Platform overview</h1>
          <p style={{ fontSize: 15, color: '#8a7fa3', margin: '8px 0 0' }}>Signed in as {user?.email}</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18, marginBottom: 26 }}>
          {stats.map((s) => (
            <div key={s.label} style={card(22)}>
              <div style={{ fontSize: 12.5, color: '#8a7fa3', fontWeight: 600, marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontFamily: serif, fontSize: 34, color: '#221a33' }}>{listLoading ? '—' : s.val}</div>
            </div>
          ))}
        </div>

        {/* User table */}
        <div style={card(0)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: '1px solid #ece4fb' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#221a33' }}>Users</div>
            {!listLoading && <div style={{ fontSize: 13, color: '#8a7fa3', fontWeight: 600 }}>{users.length} shown</div>}
          </div>

          {listError && (
            <div style={{ margin: 24, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14, fontWeight: 600, padding: '12px 16px', borderRadius: 12 }}>{listError}</div>
          )}

          {listLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a7fa3', fontSize: 14 }}>Loading users…</div>
          ) : users.length === 0 && !listError ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a7fa3', fontSize: 14 }}>No users found.</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 2fr 1.4fr 1fr', gap: 14, padding: '14px 24px', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#a89cc4', fontWeight: 700, borderBottom: '1px solid #f1ebfb' }}>
                <div>User</div><div>Email</div><div>Roles</div><div style={{ textAlign: 'right' }}>Joined</div>
              </div>
              {users.map((u) => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr 2fr 1.4fr 1fr', gap: 14, alignItems: 'center', padding: '15px 24px', borderBottom: '1px solid #f6f1fe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{initials(u)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#221a33', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName(u)}</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#5b5172', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(u.roles && u.roles.length ? u.roles : ['user']).map((r) => (
                      <span key={r} style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: r === 'admin' ? 'rgba(124,58,237,.12)' : 'rgba(138,127,163,.12)', color: r === 'admin' ? '#7c3aed' : '#8a7fa3' }}>{r}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#a89cc4', textAlign: 'right' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Centered({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#faf7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  )
}

const primaryLink = {
  display: 'inline-block',
  padding: '13px 22px',
  borderRadius: 13,
  background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
  boxShadow: '0 14px 30px rgba(124,58,237,.32)',
}
