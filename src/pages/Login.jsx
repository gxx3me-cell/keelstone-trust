import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useAnim } from '../hooks/useReveal'
import { db } from '../lib/cocobase'

const serif = "'DM Serif Display',serif"

function fieldStyle(focused) {
  return {
    width: '100%', padding: '15px 16px', borderRadius: 14,
    border: `1.5px solid ${focused ? '#7c3aed' : '#ece4fb'}`,
    background: '#fff', fontSize: 15, color: '#221a33', outline: 'none',
    boxShadow: focused ? '0 0 0 4px rgba(124,58,237,.12)' : 'none',
    transition: 'border-color .25s,box-shadow .25s',
  }
}

export default function Login() {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const [focus, setFocus] = useState('')
  const [btnHover, setBtnHover] = useState(false)
  const [socialHover, setSocialHover] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useAnim(rootRef)

  async function handleLogin() {
    setError('')
    if (!email || !pw) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    try {
      const result = await db.auth.login({ email, password: pw })
      if (result?.requires_2fa) {
        setError('Two-factor authentication is required for this account.')
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} data-authgrid style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr' }}>
      {/* LEFT: brand panel */}
      <div data-brandpanel style={{ position: 'relative', overflow: 'hidden', background: '#2a1060', padding: '48px clamp(32px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <ImageSlot id="login-panel-bg" shape="rect" placeholder="Brand panel background" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg,rgba(124,58,237,.82) 0%,rgba(109,28,140,.78) 55%,rgba(88,14,100,.88) 100%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: '-10%', left: '-12%', width: 420, height: 420, background: 'rgba(255,255,255,.16)', filter: 'blur(20px)', animation: 'blobMorph 16s ease-in-out infinite, floatA 11s ease-in-out infinite', borderRadius: '45%', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '-14%', right: '-8%', width: 340, height: 340, background: 'rgba(255,255,255,.12)', filter: 'blur(28px)', animation: 'floatB 13s ease-in-out infinite', borderRadius: '50%', zIndex: 1 }} />

        <div data-anim style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 23 }}>Lumen</span>
        </div>

        <div data-anim data-delay="120" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,3.4vw,50px)', lineHeight: 1.1, margin: '0 0 20px' }}>Welcome back to your reserve.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, opacity: .9, margin: '0 0 36px', maxWidth: 420 }}>Pick up exactly where you left off. Your portfolio has been working while you were away.</p>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,.25)', boxShadow: '0 30px 60px rgba(0,0,0,.25)', maxWidth: 420 }}>
            <ImageSlot id="login-art" shape="rect" placeholder="Dashboard / lifestyle image" style={{ width: '100%', height: 240 }} />
          </div>
        </div>

        <div data-anim data-delay="220" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 30 }}>
          {[['$4.8B', 'Under guidance'], ['99.9%', 'Custody uptime'], ['12k+', 'Investors']].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: serif, fontSize: 26 }}>{v}</div><div style={{ fontSize: 13, opacity: .8 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* RIGHT: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px clamp(24px,5vw,72px)' }}>
        <div data-anim data-delay="80" style={{ width: '100%', maxWidth: 404 }}>
          <div style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 12 }}>Client login</div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 8px' }}>Sign in</h2>
          <p style={{ fontSize: 15, color: '#8a7fa3', margin: '0 0 32px' }}>New to Lumen? <Link to="/signup" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Open an account</Link></p>

          <button
            type="button"
            onMouseEnter={() => setSocialHover(true)}
            onMouseLeave={() => setSocialHover(false)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, border: `1px solid ${socialHover ? '#d9c9f7' : '#ece4fb'}`, background: socialHover ? '#faf7ff' : '#fff', fontSize: 15, fontWeight: 600, color: '#3a2f52', cursor: 'pointer', transition: 'background .25s,border-color .25s', marginBottom: 14 }}
          >
            <span style={{ fontWeight: 800, color: '#ea4335' }}>G</span> Continue with Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#ece4fb' }} />
            <span style={{ fontSize: 12, color: '#a89cc4', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#ece4fb' }} />
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3a2f52', marginBottom: 8 }}>Email address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocus('email')} onBlur={() => setFocus('')} style={{ ...fieldStyle(focus === 'email'), marginBottom: 18 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3a2f52' }}>Password</label>
            <a href="#" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Forgot?</a>
          </div>
          <input type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} onFocus={() => setFocus('pw')} onBlur={() => setFocus('')} style={{ ...fieldStyle(focus === 'pw'), marginBottom: 20 }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#5b5172', marginBottom: 26, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer' }} /> Keep me signed in
          </label>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 12, marginBottom: 16 }}>{error}</div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={submitting}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{ display: 'block', textAlign: 'center', width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: btnHover ? '0 22px 44px rgba(124,58,237,.4)' : '0 16px 36px rgba(124,58,237,.32)', transform: btnHover && !submitting ? 'translateY(-2px)' : 'none', transition: 'transform .25s,box-shadow .25s' }}
          >
            {submitting ? 'Signing in…' : 'Sign in to your reserve'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#a89cc4', margin: '24px 0 0' }}>Protected by bank-grade encryption &amp; multi-sig custody.</p>
          <p style={{ textAlign: 'center', fontSize: 14, margin: '18px 0 0' }}><Link to="/" style={{ color: '#8a7fa3', textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link></p>
        </div>
      </div>
    </div>
  )
}
