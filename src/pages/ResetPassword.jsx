import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAnim } from '../hooks/useReveal'
import { supabase } from '../lib/supabase'
import { ArrowRight, Eye, EyeSlash, CheckCircle, WarningCircle } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0a0612', body: '#3d3450', muted: '#7c728f',
  line: '#ede8f7', surface: '#f5f2fc', primary: '#6d28d9', accent: '#c026d3', white: '#fff',
}
const RAD = 0
const MIN_LENGTH = 8

// Supabase's recovery link carries the token in the URL fragment. The client is
// created with detectSessionInUrl, so the SDK consumes it and emits a
// PASSWORD_RECOVERY event — we just wait for the resulting session rather than
// parsing anything ourselves.

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
  const { t } = useI18n()
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [focus, setFocus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  // The recovery link puts us in a temporary authenticated session. Until that
  // resolves we can't tell a bad link from one still being processed, so hold
  // the form in a "checking" state rather than flashing an error.
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true)
      if (active) setChecking(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setChecking(false)
      }
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

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
      // The recovery link already signed us in, so this updates the password
      // on the current session.
      const { error: updateError } = await supabase.auth.updateUser({ password: pw })
      if (updateError) throw updateError

      setDone(true)
      // Sign out so the temporary recovery session can't linger, then send them
      // back to sign in with the new password.
      await supabase.auth.signOut()
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
          {/* Still resolving the recovery session from the URL */}
          {checking ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <div style={{ fontSize: 14.5, color: C.muted }}>Checking your reset link…</div>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff5f5', border: '1px solid #f6cccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <WarningCircle size={30} color="#b91c1c" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 26, color: C.ink, marginBottom: 12 }}>Link expired or invalid</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>
                Reset links can only be used once and expire after a short while. Request a fresh one and we&apos;ll email it straight over.
              </p>
              <Link to="/forgot-password" style={{ display: 'block', padding: 14, borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                {t('auth.requestNewLink')}
              </Link>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(22,163,74,.35)' }}>
                <CheckCircle size={30} color="#fff" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 28, color: C.ink, marginBottom: 12 }}>{t('auth.passwordUpdated')}</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '0 0 28px' }}>
                {t('auth.passwordUpdatedBody')}
              </p>
              <Link to="/login" style={{ display: 'block', padding: 14, borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                {t('auth.signInNow')}
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>{t('auth.resetEyebrow')}</div>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 8px', color: C.ink }}>{t('auth.newPasswordTitle')}</h2>
              <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
                {t('auth.newPasswordBody')}
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7, letterSpacing: '.02em' }}>{t('auth.newPassword')}</span>
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
