import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAnim } from '../hooks/useReveal'
import { db } from '../lib/cocobase'
import { ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0e0e12', body: '#4a4a55', muted: '#8b8b97',
  line: '#e7e7ec', surface: '#f6f6f8', primary: '#7c3aed', white: '#fff',
}
const RAD = 8

// Pull the token from the query string or hash, tolerating a few param names.
function readToken() {
  try {
    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
    return (
      search.get('token') || search.get('t') || search.get('code') ||
      hash.get('token') || hash.get('t') || hash.get('code') || ''
    )
  } catch {
    return ''
  }
}

export default function VerifyEmail() {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')
  useAnim(rootRef)

  useEffect(() => {
    const token = readToken()
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token. Please use the link from your email, or request a new one.')
      return
    }
    let active = true
    db.auth
      .verifyEmail(token)
      .then(() => {
        if (!active) return
        setStatus('success')
      })
      .catch((err) => {
        if (!active) return
        setStatus('error')
        setMessage(err?.message || 'This verification link is invalid or has expired.')
      })
    return () => { active = false }
  }, [])

  return (
    <div ref={rootRef} style={{ minHeight: '100vh', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div data-anim style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/uploads/kneelstone-logo.png" alt="Kneelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 20, color: '#fff' }}>Kneelstone Trust</span>
        </Link>

        <div style={{ background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 40px 90px rgba(0,0,0,.4)', textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e7e7ec', borderTopColor: C.primary, margin: '0 auto 22px', animation: 'spin .8s linear infinite' }} />
              <div style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 10 }}>Verifying your email…</div>
              <p style={{ fontSize: 14.5, color: C.muted, margin: 0 }}>This will only take a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(22,163,74,.35)' }}>
                <CheckCircle size={30} color="#fff" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 28, color: C.ink, marginBottom: 12 }}>Email verified</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>Your email address has been confirmed. You're all set to access your investor portal.</p>
              <button type="button" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue to sign in <ArrowRight size={16} weight="bold" />
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff5f5', border: '1px solid #f6cccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <WarningCircle size={30} color="#b91c1c" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 12 }}>Verification failed</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>{message}</p>
              <Link to="/login" style={{ display: 'block', padding: 14, borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
