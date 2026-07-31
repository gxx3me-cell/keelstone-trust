import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAnim } from '../hooks/useReveal'
import { db } from '../lib/cocobase'
import { ArrowRight, Eye, EyeSlash, CheckCircle, WarningCircle } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0a0612', body: '#3d3450', muted: '#7c728f',
  line: '#ede8f7', surface: '#f5f2fc', primary: '#6d28d9', accent: '#c026d3', white: '#fff',
}
const RAD = 0
const MIN_LENGTH = 8

// Same tolerant parser used by VerifyEmail — accepts token/t/code in query or hash.
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

const barColors = ['#ef4444', '#f97316', '#eab308', '#16a34a']
const words = ['Weak', 'Fair', 'Good', 'Strong']

function scorePassword(v) {
  let score = 0
  if (v.length >= MIN_LENGTH) score++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++
  if (/\d/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  return score
}

export default function ResetPassword() {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [focus, setFocus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  useEffect(() => { setToken(readToken()) }, [])

  const score = scorePassword(pw)
  const activeColor = barColors[Math.min(score, 4) - 1] || '#ef4444'
  const mismatch = confirmPw.length > 0 && pw !== confirmPw

  async function handleSubmit(e) {
    e?.preventDefault()
    setError('')
    if (pw.length < MIN_LENGTH) { setError(`Password must be at least ${MIN_LENGTH} characters.`); return }
    if (pw !== confirmPw) { setError('The two passwords do not match.'); return }
    setSubmitting(true)
    try {
      const res = await db.functions.execute('complete_password_reset', {
        payload: { token, new_password: pw },
        method: 'POST',
      })
      const r = res?.result ?? res
      if (r?.error) throw new Error(r.error)
      setDone(true)
      setTimeout(() => navigate('/login'), 3200)
    } catch (err) {
      setError(err?.message || 'Could not reset your password. Please request a new link.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = (name) => ({
    width: '100%', padding: '14px 16px', paddingRight: 46,
    border: 'none', borderBottom: `2px solid ${focus === name ? C.ink : C.line}`,
    borderRadius: `${RAD}px ${RAD}px 0 0`,
    background: focus === name ? '#fff' : C.surface,
    fontSize: 15, color: C.ink, outline: 'none',
    transition: 'background .2s, border-color .2s',
    fontFamily: 'inherit', boxSizing: 'border-box',
  })

  return (
    <div ref={rootRef} style={{ minHeight: '100vh', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div data-anim style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 20, color: '#fff' }}>Keelstone Trust</span>
        </Link>

        <div style={{ background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>
          {/* No token in the URL at all */}
          {!token ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff5f5', border: '1px solid #f6cccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <WarningCircle size={30} color="#b91c1c" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 12 }}>Link incomplete</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>
                This reset link is missing its token. Please open the link directly from your email, or request a new one.
              </p>
              <Link to="/forgot-password" style={{ display: 'block', padding: 14, borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(22,163,74,.35)' }}>
                <CheckCircle size={30} color="#fff" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 28, color: C.ink, marginBottom: 12 }}>Password updated</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>
                Your password has been changed. Taking you to sign in…
              </p>
              <Link to="/login" style={{ display: 'block', padding: 14, borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>Password reset</div>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 8px', color: C.ink }}>Choose a new password</h2>
              <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
                Pick something you haven't used before. This link can only be used once.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7, letterSpacing: '.02em' }}>New password</span>
                  <span style={{ position: 'relative', display: 'block' }}>
                    <input
                      type={showPw ? 'text' : 'password'} value={pw}
                      onChange={(e) => setPw(e.target.value)} placeholder="Create a password"
                      onFocus={() => setFocus('pw')} onBlur={() => setFocus('')}
                      style={inputStyle('pw')}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: C.muted, display: 'flex' }}>
                      {showPw ? <EyeSlash size={19} /> : <Eye size={19} />}
                    </button>
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 5, margin: '10px 0 6px' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? activeColor : C.line, transition: 'background .3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 18, height: 14, color: pw.length === 0 ? C.muted : activeColor }}>
                  {pw.length === 0 ? `Use ${MIN_LENGTH}+ characters with a mix of letters & numbers` : words[Math.min(score, 4) - 1] || 'Weak'}
                </div>

                <label style={{ display: 'block', marginBottom: 22 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7, letterSpacing: '.02em' }}>Confirm new password</span>
                  <span style={{ position: 'relative', display: 'block' }}>
                    <input
                      type={showPw ? 'text' : 'password'} value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter your password"
                      onFocus={() => setFocus('confirm')} onBlur={() => setFocus('')}
                      style={{ ...inputStyle('confirm'), borderBottomColor: mismatch ? '#ef4444' : (focus === 'confirm' ? C.ink : C.line) }}
                    />
                  </span>
                  {mismatch && <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#ef4444', marginTop: 6 }}>Passwords do not match.</span>}
                </label>

                {error && (
                  <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: RAD, marginBottom: 16 }}>{error}</div>
                )}

                <button type="submit" disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {submitting ? 'Updating…' : <>Set new password <ArrowRight size={16} weight="bold" /></>}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, margin: '22px 0 0', color: C.muted }}>
                Remembered it? <Link to="/login" style={{ color: C.ink, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
