import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useAnim } from '../hooks/useReveal'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import { ArrowRight, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0a0612', body: '#3d3450', muted: '#7c728f',
  line: '#ede8f7', surface: '#f5f2fc', primary: '#6d28d9', accent: '#c026d3', white: '#fff',
}
const RAD = 0

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
  const { t } = useI18n()
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [focus, setFocus] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  async function handleLogin(e) {
    e?.preventDefault()
    setError('')
    if (!email || !pw) { setError(t('auth.enterBoth')); return }
    setSubmitting(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      })
      // supabase-js returns errors rather than throwing — checking this is not optional.
      if (signInError) throw signInError

      // Role lives in profiles, not on the auth user. Route admins to the console.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()
      navigate(profile?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err?.message || t('auth.invalidCredentials'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} data-authgrid style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr', background: '#fff', color: C.ink }}>
      {/* LEFT: brand panel */}
      <div data-brandpanel style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#0a0612 0%,#130a28 60%,#1a0a2e 100%)', padding: '46px clamp(32px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: .22 }}>
          <img src="/uploads/pasted-1782018213315-0.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,6,18,.5),rgba(10,6,18,.9)), radial-gradient(ellipse 70% 60% at 80% 30%, rgba(109,40,217,.25) 0%, transparent 70%)', zIndex: 1 }} />

        <div data-anim style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <span style={{ fontFamily: serif, fontSize: 20 }}>Keelstone Trust</span>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 1 }}>Investor Portal</div>
          </div>
        </div>

        <div data-anim data-delay="120" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,3.4vw,48px)', lineHeight: 1.1, margin: '0 0 18px' }}>Welcome back to your portfolio.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', margin: '0 0 32px', maxWidth: 410 }}>Your portfolio has been actively managed while you were away. Sign in to review your performance.</p>
          <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.18)', maxWidth: 420 }}>
            <img src="/uploads/pasted-1782018213315-0.png" alt="Keelstone Trust dashboard" style={{ width: '100%', height: 230, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 18px 16px', background: 'linear-gradient(to top, rgba(10,6,18,.88) 0%, transparent 100%)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Live Portfolio</div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#fff' }}>+18.6% all-time return</div>
            </div>
          </div>
        </div>

        <div data-anim data-delay="220" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 28 }}>
          {[['$1.4B', 'Under management'], ['99.9%', 'Portfolio uptime'], ['48k+', 'Investors']].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: serif, fontSize: 24 }}>{v}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* RIGHT: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '46px clamp(22px,5vw,72px)' }}>
        <div data-anim data-delay="80" style={{ width: '100%', maxWidth: 408 }}>
          {/* The brand panel is hidden below 820px, so without this the page
              carries no branding at all on a phone. Mirrors the Signup lockup. */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, textDecoration: 'none', marginBottom: 30 }}>
            <div style={{ width: 34, height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <span style={{ fontFamily: serif, fontSize: 18, color: C.ink, display: 'block', lineHeight: 1.2 }}>Keelstone Trust</span>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Investor Portal</span>
            </div>
          </Link>

          <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>{t('auth.clientLogin')}</div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 33, margin: '0 0 8px', color: C.ink }}>{t('auth.signInTitle')}</h2>
          <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 30px' }}>{t('auth.newHere')} <Link to="/signup" style={{ color: C.ink, fontWeight: 700, textDecoration: 'none' }}>{t('auth.openOne')}</Link></p>

          <form onSubmit={handleLogin}>
            <Field
              label={t('common.email')} type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              focused={focus === 'email'} onFocus={() => setFocus('email')} onBlur={() => setFocus('')}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 }}>
              <span />
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: C.ink, fontWeight: 600, textDecoration: 'none' }}>{t('auth.forgotPassword')}</Link>
            </div>
            <Field
              label={t('common.password')} type={showPw ? 'text' : 'password'} value={pw}
              onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
              focused={focus === 'pw'} onFocus={() => setFocus('pw')} onBlur={() => setFocus('')}
              trailing={
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: C.muted, display: 'flex' }}>
                  {showPw ? <EyeSlash size={19} /> : <Eye size={19} />}
                </button>
              }
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.body, margin: '6px 0 24px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.ink, cursor: 'pointer' }} /> {t('auth.keepSignedIn')}
            </label>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: RAD, marginBottom: 16 }}>{error}</div>
            )}

            <button type="submit" disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? t('auth.signingIn') : <>{t('auth.accessPortal')} <ArrowRight size={16} weight="bold" /></>}
            </button>
          </form>

          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, color: C.muted, margin: '22px 0 0' }}><ShieldCheck size={15} weight="fill" color={C.primary} /> {t('auth.protectedBy')}</p>
          <p style={{ textAlign: 'center', fontSize: 13.5, margin: '16px 0 0' }}><Link to="/" style={{ color: C.muted, textDecoration: 'none', fontWeight: 600 }}>{t('auth.backTo')}</Link></p>
        </div>
      </div>
    </div>
  )
}
