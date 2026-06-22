import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useAnim } from '../hooks/useReveal'

const serif = "'DM Serif Display',serif"

function fieldStyle(focused) {
  return {
    width: '100%', padding: '14px 15px', borderRadius: 14,
    border: `1.5px solid ${focused ? '#7c3aed' : '#ece4fb'}`,
    background: '#fff', fontSize: 15, outline: 'none',
    boxShadow: focused ? '0 0 0 4px rgba(124,58,237,.12)' : 'none',
    transition: 'border-color .25s,box-shadow .25s',
  }
}

const barColors = ['#ef4444', '#f97316', '#fbbf24', '#22c55e']
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
  const [btnHover, setBtnHover] = useState(false)
  const [socialHover, setSocialHover] = useState(false)
  const [pw, setPw] = useState('')
  useAnim(rootRef)

  const score = scorePassword(pw)
  const activeColor = barColors[Math.min(score, 4) - 1] || '#ef4444'

  return (
    <div ref={rootRef} data-authgrid style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '.95fr 1.05fr' }}>
      {/* LEFT: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px clamp(24px,5vw,72px)', order: 1 }}>
        <div data-anim data-delay="80" style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, textDecoration: 'none', marginBottom: 34 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 12, height: 12, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
            </div>
            <span style={{ fontFamily: serif, fontSize: 21, color: '#221a33' }}>Lumen</span>
          </Link>

          <div style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 12 }}>Open your account</div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 8px' }}>Begin your reserve</h2>
          <p style={{ fontSize: 15, color: '#8a7fa3', margin: '0 0 30px' }}>Already a client? <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link></p>

          <button
            type="button"
            onMouseEnter={() => setSocialHover(true)}
            onMouseLeave={() => setSocialHover(false)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, border: `1px solid ${socialHover ? '#d9c9f7' : '#ece4fb'}`, background: socialHover ? '#faf7ff' : '#fff', fontSize: 15, fontWeight: 600, color: '#3a2f52', cursor: 'pointer', transition: 'background .25s,border-color .25s', marginBottom: 22 }}
          >
            <span style={{ fontWeight: 800, color: '#ea4335' }}>G</span> Sign up with Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: '#ece4fb' }} />
            <span style={{ fontSize: 12, color: '#a89cc4', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#ece4fb' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3a2f52', marginBottom: 8 }}>First name</label>
              <input type="text" placeholder="Jane" onFocus={() => setFocus('first')} onBlur={() => setFocus('')} style={fieldStyle(focus === 'first')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3a2f52', marginBottom: 8 }}>Last name</label>
              <input type="text" placeholder="Doe" onFocus={() => setFocus('last')} onBlur={() => setFocus('')} style={fieldStyle(focus === 'last')} />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3a2f52', marginBottom: 8 }}>Email address</label>
          <input type="email" placeholder="you@example.com" onFocus={() => setFocus('email')} onBlur={() => setFocus('')} style={{ ...fieldStyle(focus === 'email'), marginBottom: 18 }} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3a2f52', marginBottom: 8 }}>Password</label>
          <input type="password" placeholder="Create a password" value={pw} onChange={(e) => setPw(e.target.value)} onFocus={() => setFocus('pw')} onBlur={() => setFocus('')} style={{ ...fieldStyle(focus === 'pw'), marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < score ? activeColor : '#ece4fb', transition: 'background .3s' }} />
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 20, height: 15, color: pw.length === 0 ? '#a89cc4' : activeColor }}>
            {pw.length === 0 ? 'Use 8+ characters with a mix of letters & numbers' : words[Math.min(score, 4) - 1] || 'Weak'}
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#5b5172', lineHeight: 1.5, marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer', marginTop: 2, flex: 'none' }} /> I agree to the <a href="#" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Terms</a> &amp; <a href="#" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
          </label>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{ display: 'block', textAlign: 'center', width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: btnHover ? '0 22px 44px rgba(124,58,237,.4)' : '0 16px 36px rgba(124,58,237,.32)', transform: btnHover ? 'translateY(-2px)' : 'none', transition: 'transform .25s,box-shadow .25s' }}
          >
            Create my reserve
          </button>
        </div>
      </div>

      {/* RIGHT: brand panel */}
      <div data-brandpanel style={{ position: 'relative', overflow: 'hidden', background: '#2a1060', padding: '48px clamp(32px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', order: 2 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <ImageSlot id="signup-panel-bg" shape="rect" placeholder="Brand panel background" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg,rgba(124,58,237,.82) 0%,rgba(109,28,140,.78) 55%,rgba(88,14,100,.88) 100%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: '-12%', right: '-12%', width: 440, height: 440, background: 'rgba(255,255,255,.16)', filter: 'blur(20px)', animation: 'blobMorph 16s ease-in-out infinite, floatA 12s ease-in-out infinite', borderRadius: '45%', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '-16%', left: '-10%', width: 360, height: 360, background: 'rgba(255,255,255,.12)', filter: 'blur(28px)', animation: 'floatB 13s ease-in-out infinite', borderRadius: '50%', zIndex: 1 }} />

        <div data-anim style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,3.4vw,50px)', lineHeight: 1.1, margin: '0 0 18px', maxWidth: 440 }}>Join investors who think in generations.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, opacity: .9, margin: 0, maxWidth: 420 }}>Institutional-grade digital asset strategies built on preservation, growth, and income.</p>
        </div>

        <div data-anim data-delay="140" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,.25)', boxShadow: '0 30px 60px rgba(0,0,0,.25)', marginBottom: 26 }}>
            <ImageSlot id="signup-art" shape="rect" placeholder="Lifestyle / app image" style={{ width: '100%', height: 230 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['No minimums to begin your reserve', 'Bank-grade security & multi-sig custody', 'A dedicated advisor for larger mandates'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flex: 'none' }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
