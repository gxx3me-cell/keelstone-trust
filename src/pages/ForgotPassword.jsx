import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAnim } from '../hooks/useReveal'
import { supabase } from '../lib/supabase'
import { ArrowRight, EnvelopeSimple } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0a0612', body: '#3d3450', muted: '#7c728f',
  line: '#ede8f7', surface: '#f5f2fc', primary: '#6d28d9', accent: '#c026d3', white: '#fff',
}
const RAD = 0

export default function ForgotPassword() {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const [email, setEmail] = useState('')
  const [focus, setFocus] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  async function handleSubmit(e) {
    e?.preventDefault()
    setError('')
    if (!email) { setError(t('auth.enterEmail')); return }
    setSubmitting(true)
    try {
      // Supabase sends the recovery email and manages the token. The link lands
      // on /reset-password, where the SDK picks up the recovery session.
      // Customise the wording under Auth → Email Templates → Reset Password.
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setDone(true)
    } catch {
      // Always show success even on error to avoid email enumeration
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} style={{ minHeight: '100vh', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background gradient blobs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div data-anim style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 20, color: '#fff' }}>Keelstone Trust</span>
        </Link>

        <div style={{ background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(109,40,217,.45)' }}>
                <EnvelopeSimple size={28} color="#fff" weight="fill" />
              </div>
              <div style={{ fontFamily: serif, fontSize: 28, color: C.ink, marginBottom: 12 }}>{t('auth.checkInbox')}</div>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: '0 0 28px' }}>
                If <strong style={{ color: C.ink }}>{email}</strong> is registered with Keelstone Trust, you'll receive a password reset link shortly.
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
                {t('auth.checkSpam')}
              </p>
              <Link to="/login" style={{ display: 'block', padding: '13px', borderRadius: RAD, background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                {t('auth.backToSignIn')}
              </Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>{t('auth.resetEyebrow')}</div>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 8px', color: C.ink }}>{t('auth.resetTitle')}</h2>
              <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
                {t('auth.resetBody')}
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 22 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7, letterSpacing: '.02em' }}>Email address</span>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
                    style={{
                      width: '100%', padding: '14px 16px',
                      border: 'none', borderBottom: `2px solid ${focus ? C.ink : C.line}`,
                      borderRadius: `${RAD}px ${RAD}px 0 0`,
                      background: focus ? '#fff' : C.surface,
                      fontSize: 15, color: C.ink, outline: 'none',
                      transition: 'background .2s, border-color .2s',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                {error && (
                  <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: RAD, marginBottom: 16 }}>{error}</div>
                )}

                <button type="submit" disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {submitting ? t('common.sending') : <>{t('auth.sendResetLink')} <ArrowRight size={16} weight="bold" /></>}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, margin: '22px 0 0', color: C.muted }}>
                {t('auth.rememberedIt')} <Link to="/login" style={{ color: C.ink, fontWeight: 700, textDecoration: 'none' }}>{t('common.signIn')}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
