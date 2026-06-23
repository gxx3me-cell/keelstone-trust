import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useAnim } from '../hooks/useReveal'
import { db } from '../lib/cocobase'
import { Vault, ArrowRight, GoogleLogo, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0e0e12', body: '#4a4a55', muted: '#8b8b97',
  line: '#e7e7ec', surface: '#f6f6f8', primary: '#7c3aed', white: '#fff',
}
const RAD = 8

// A distinct field: filled surface, sharp top, single ink underline that
// thickens and darkens on focus — intentionally different from a bordered box.
function Field({ label, type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, trailing }) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7, letterSpacing: '.02em' }}>{label}</span>
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={onFocus} onBlur={onBlur}
          style={{
            width: '100%', padding: '14px 16px', paddingRight: trailing ? 46 : 16,
            border: 'none', borderBottom: `2px solid ${focused ? C.ink : C.line}`,
            borderRadius: `${RAD}px ${RAD}px 0 0`,
            background: focused ? '#fff' : C.surface,
            fontSize: 15, color: C.ink, outline: 'none',
            transition: 'background .2s, border-color .2s',
          }}
        />
        {trailing}
      </span>
    </label>
  )
}

export default function Login() {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [focus, setFocus] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  async function handleLogin() {
    setError('')
    if (!email || !pw) { setError('Enter your email and password.'); return }
    setSubmitting(true)
    try {
      const result = await db.auth.login({ email, password: pw })
      if (result?.requires_2fa) { setError('Two-factor authentication is required for this account.'); return }
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} data-authgrid style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr', background: '#fff', color: C.ink }}>
      {/* LEFT: brand panel — ink, restrained */}
      <div data-brandpanel style={{ position: 'relative', overflow: 'hidden', background: C.ink, padding: '46px clamp(32px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: .35 }}>
          <ImageSlot id="login-panel-bg" shape="rect" placeholder="" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,14,18,.6),rgba(14,14,18,.92))', zIndex: 1 }} />

        <div data-anim style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 7, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Vault size={19} color="#fff" weight="duotone" />
          </div>
          <span style={{ fontFamily: serif, fontSize: 22 }}>Lumen</span>
        </div>

        <div data-anim data-delay="120" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,3.4vw,48px)', lineHeight: 1.1, margin: '0 0 18px' }}>Welcome back to your reserve.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', margin: '0 0 32px', maxWidth: 410 }}>Pick up exactly where you left off. Your portfolio has been working while you were away.</p>
          <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.18)', maxWidth: 420 }}>
            <ImageSlot id="login-art" shape="rect" placeholder="Dashboard preview" style={{ width: '100%', height: 230 }} />
          </div>
        </div>

        <div data-anim data-delay="220" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 28 }}>
          {[['$1.4B', 'Under guidance'], ['99.9%', 'Custody uptime'], ['48k+', 'Investors']].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: serif, fontSize: 24 }}>{v}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* RIGHT: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '46px clamp(22px,5vw,72px)' }}>
        <div data-anim data-delay="80" style={{ width: '100%', maxWidth: 408 }}>
          <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>Client login</div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 33, margin: '0 0 8px', color: C.ink }}>Sign in</h2>
          <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 30px' }}>New to Lumen? <Link to="/signup" style={{ color: C.ink, fontWeight: 700, textDecoration: 'none' }}>Open an account</Link></p>

          <button type="button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 13, borderRadius: RAD, border: `1px solid ${C.line}`, background: '#fff', fontSize: 14.5, fontWeight: 600, color: C.ink, cursor: 'pointer', marginBottom: 22 }}>
            <GoogleLogo size={19} weight="bold" /> Continue with Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 0 22px' }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>

          <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" focused={focus === 'email'} onFocus={() => setFocus('email')} onBlur={() => setFocus('')} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 }}>
            <span />
            <a href="#" style={{ fontSize: 12.5, color: C.ink, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <Field
            label="Password" type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
            focused={focus === 'pw'} onFocus={() => setFocus('pw')} onBlur={() => setFocus('')}
            trailing={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: C.muted, display: 'flex' }}>
                {showPw ? <EyeSlash size={19} /> : <Eye size={19} />}
              </button>
            }
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.body, margin: '6px 0 24px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.ink, cursor: 'pointer' }} /> Keep me signed in
          </label>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: RAD, marginBottom: 16 }}>{error}</div>
          )}

          <button type="button" onClick={handleLogin} disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Signing in…' : <>Sign in to your reserve <ArrowRight size={16} weight="bold" /></>}
          </button>

          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, color: C.muted, margin: '22px 0 0' }}><ShieldCheck size={15} weight="fill" color={C.primary} /> Protected by bank-grade encryption &amp; multi-sig custody.</p>
          <p style={{ textAlign: 'center', fontSize: 13.5, margin: '16px 0 0' }}><Link to="/" style={{ color: C.muted, textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link></p>
        </div>
      </div>
    </div>
  )
}
