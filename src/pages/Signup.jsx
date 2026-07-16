import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useAnim } from '../hooks/useReveal'
import { db } from '../lib/cocobase'
import { Vault, ArrowRight, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = {
  ink: '#0a0612', body: '#3d3450', muted: '#7c728f',
  line: '#ede8f7', surface: '#f5f2fc', primary: '#6d28d9', accent: '#c026d3', white: '#fff',
}
const RAD = 0

function Field({ label, type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, trailing }) {
  return (
    <label style={{ display: 'block' }}>
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

const barColors = ['#ef4444', '#f97316', '#eab308', '#16a34a']
const words = ['Weak', 'Fair', 'Good', 'Strong']

function scorePassword(v) {
  let score = 0
  if (v.length >= 8) score++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++
  if (/\d/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  return score
}

export default function Signup() {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [focus, setFocus] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  const score = scorePassword(pw)
  const activeColor = barColors[Math.min(score, 4) - 1] || '#ef4444'

  async function handleSignup(e) {
    e?.preventDefault()
    setError('')
    if (!firstName || !email || !pw) { setError('First name, email and password are required.'); return }
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy.'); return }
    setSubmitting(true)
    try {
      await db.auth.register({
        email, password: pw,
        data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() },
      })
      // Send the verification email (fire-and-forget — won't block signup if email isn't configured)
      db.auth.requestEmailVerification().catch(() => {})
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || 'Could not create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} data-authgrid style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '.95fr 1.05fr', background: '#fff', color: C.ink }}>
      {/* LEFT: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '46px clamp(22px,5vw,72px)', order: 1 }}>
        <div data-anim data-delay="80" style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, textDecoration: 'none', marginBottom: 30 }}>
            <div style={{ width: 34, height: 34, borderRadius: 7, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Vault size={18} color="#fff" weight="duotone" />
            </div>
            <div>
              <span style={{ fontFamily: serif, fontSize: 18, color: C.ink, display: 'block' }}>Lumen</span>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Investor Portal</span>
            </div>
          </Link>

          <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 10 }}>Open your account</div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 33, margin: '0 0 8px', color: C.ink }}>Begin your investment</h2>
          <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 28px' }}>Already a client? <Link to="/login" style={{ color: C.ink, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link></p>

          <form onSubmit={handleSignup}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Field label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" focused={focus === 'first'} onFocus={() => setFocus('first')} onBlur={() => setFocus('')} />
              <Field label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" focused={focus === 'last'} onFocus={() => setFocus('last')} onBlur={() => setFocus('')} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" focused={focus === 'email'} onFocus={() => setFocus('email')} onBlur={() => setFocus('')} />
            </div>

            <Field
              label="Password" type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Create a password"
              focused={focus === 'pw'} onFocus={() => setFocus('pw')} onBlur={() => setFocus('')}
              trailing={
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: C.muted, display: 'flex' }}>
                  {showPw ? <EyeSlash size={19} /> : <Eye size={19} />}
                </button>
              }
            />
            <div style={{ display: 'flex', gap: 5, margin: '10px 0 6px' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? activeColor : C.line, transition: 'background .3s' }} />
              ))}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 18, height: 14, color: pw.length === 0 ? C.muted : activeColor }}>
              {pw.length === 0 ? 'Use 8+ characters with a mix of letters & numbers' : words[Math.min(score, 4) - 1] || 'Weak'}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: C.body, lineHeight: 1.5, marginBottom: 22, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.ink, cursor: 'pointer', marginTop: 2, flex: 'none' }} />
              I agree to the <Link to="/terms" style={{ color: C.ink, fontWeight: 600, textDecoration: 'none' }}>Terms</Link> &amp; <Link to="/privacy" style={{ color: C.ink, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link> of Lumen.
            </label>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: RAD, marginBottom: 16 }}>{error}</div>
            )}

            <button type="submit" disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 15, borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating account…' : <>Open my Lumen account <ArrowRight size={16} weight="bold" /></>}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: brand panel */}
      <div data-brandpanel style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#0a0612 0%,#130a28 60%,#1a0a2e 100%)', padding: '46px clamp(32px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', order: 2 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: .2 }}>
          <img src="/uploads/pasted-1782018213315-0.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,6,18,.5),rgba(10,6,18,.9)), radial-gradient(ellipse 70% 60% at 20% 70%, rgba(109,40,217,.22) 0%, transparent 70%)', zIndex: 1 }} />

        <div data-anim style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,3.4vw,48px)', lineHeight: 1.1, margin: '0 0 16px', maxWidth: 440 }}>Join investors who trust professionals to manage their digital wealth.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', margin: 0, maxWidth: 420 }}>Lumen offers professionally managed digital asset portfolios — built on preservation, growth, and income.</p>
        </div>

        <div data-anim data-delay="140" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.18)', marginBottom: 24 }}>
            <img src="/uploads/pasted-1782018213315-0.png" alt="Portfolio dashboard" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 18px 16px', background: 'linear-gradient(to top, rgba(10,6,18,.88) 0%, transparent 100%)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>Portfolio Dashboard</div>
              <div style={{ fontFamily: serif, fontSize: 17, color: '#fff' }}>Managed. Monitored. Transparent.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[
              'Professional portfolio management from day one',
              'Institutional-grade security & multi-sig custody',
              'Full transparency into performance and allocation',
              'Dedicated advisor for Private tier investors',
            ].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14.5 }}>
                <ShieldCheck size={20} weight="fill" color={C.primary} style={{ flex: 'none' }} /> {t}
              </div>
            ))}
          </div>
        </div>

        <div data-anim data-delay="240" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[['$1.4B', 'Under management'], ['48k+', 'Investors'], ['38', 'Countries']].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: serif, fontSize: 24 }}>{v}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{l}</div></div>
          ))}
        </div>
      </div>
    </div>
  )
}
