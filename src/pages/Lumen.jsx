import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot'
import { useReveal, useCountUp } from '../hooks/useReveal'

const heroImg = '/uploads/pasted-1782018213315-0.png'

const reportData = {
  'report-1': {
    bg: 'linear-gradient(168deg,#2a1a52 0%,#3a1d63 48%,#1f1438 100%)',
    tag: 'CORE RESERVE',
    tagBg: 'rgba(168,85,247,.25)',
    tagColor: '#d4b3ff',
    title: 'The Preservation Portfolio',
    desc: 'A conservative allocation across the most liquid, institutionally-adopted digital assets. Engineered to protect capital and weather volatility while generating a steady base yield.',
    stats: [['4.1%', 'Target yield'], ['Low', 'Risk profile'], ['12+', 'Core assets']],
    bullets: [
      'Capital protection through deep-liquidity assets',
      'Quarterly risk-managed rebalancing',
      'Institutional multi-signature custody',
    ],
    bulletColor: '#a855f7',
    ctaColor: '#2a1a52',
    cta: 'Invest in this strategy',
    slot: 'lumen-r1',
    imageLeft: false,
  },
  'report-2': {
    bg: 'linear-gradient(168deg,#5a1840 0%,#7a1e4e 46%,#3a1230 100%)',
    tag: 'GROWTH',
    tagBg: 'rgba(236,72,153,.28)',
    tagColor: '#ffc2dd',
    title: 'The Appreciation Mandate',
    desc: 'Long-term exposure to assets positioned for structural adoption. Designed to compound through market cycles rather than chase short-term momentum.',
    stats: [['11.6%', 'Target yield'], ['Med', 'Risk profile'], ['5yr+', 'Horizon']],
    bullets: [
      'Conviction-weighted toward structural winners',
      'Built to compound across full cycles',
      'Disciplined entry, never trend-chasing',
    ],
    bulletColor: '#ec4899',
    ctaColor: '#5a1840',
    cta: 'Invest in this strategy',
    slot: 'lumen-r2',
    imageLeft: true,
  },
  'report-3': {
    bg: 'linear-gradient(168deg,#5e2a12 0%,#7a3a16 46%,#3a1f0e 100%)',
    tag: 'INCOME',
    tagBg: 'rgba(249,115,22,.3)',
    tagColor: '#ffd0a3',
    title: 'The Yield Engine',
    desc: 'Passive returns generated through curated staking networks and yield-producing blockchain infrastructure — income without compromising on security.',
    stats: [['7.2%', 'Target yield'], ['Low–Med', 'Risk profile'], ['Daily', 'Accrual']],
    bullets: [
      'Diversified across vetted staking networks',
      'Yield auto-compounded into your reserve',
      'Validator risk continuously monitored',
    ],
    bulletColor: '#f97316',
    ctaColor: '#5e2a12',
    cta: 'Invest in this strategy',
    slot: 'lumen-r3',
    imageLeft: false,
  },
  'report-4': {
    bg: 'linear-gradient(168deg,#3a1d63 0%,#7a1e4e 60%,#5e2a12 130%)',
    tag: 'BESPOKE',
    tagBg: 'rgba(255,255,255,.18)',
    tagColor: '#fff',
    title: 'The Private Mandate',
    desc: 'For reserves above $1M, we construct a fully bespoke allocation around your goals — paired with a dedicated wealth advisor and private reporting.',
    stats: null,
    bullets: [
      'A dedicated advisor and private line',
      'Custom allocation across all three pillars',
      'Quarterly in-person strategy reviews',
    ],
    bulletColor: '#fff',
    ctaColor: '#3a1d63',
    cta: 'Speak with an advisor',
    slot: 'lumen-r4',
    imageLeft: true,
  },
}

const serif = "'DM Serif Display',serif"

export default function Lumen() {
  const rootRef = useRef(null)
  const navRef = useRef(null)
  const [activeReport, setActiveReport] = useState(null)
  const [shown, setShown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useReveal(rootRef)
  useCountUp(rootRef)

  // nav background on scroll
  useEffect(() => {
    const nav = navRef.current
    const onScroll = () => {
      const sy = window.scrollY || window.pageYOffset
      if (!nav) return
      if (sy > 30) {
        nav.style.background = 'rgba(250,247,255,.82)'
        nav.style.backdropFilter = 'blur(16px)'
        nav.style.boxShadow = '0 6px 30px rgba(85,40,150,.08)'
        nav.style.padding = '14px clamp(20px,5vw,72px)'
      } else {
        nav.style.background = 'transparent'
        nav.style.backdropFilter = 'none'
        nav.style.boxShadow = 'none'
        nav.style.padding = '20px clamp(20px,5vw,72px)'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openReport = (id) => {
    setActiveReport(id)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => setShown(true))
  }
  const closeReport = () => {
    setShown(false)
    document.body.style.overflow = ''
    setTimeout(() => setActiveReport(null), 460)
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { closeReport(); setMenuOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navItems = [
    ['Philosophy', '#story'], ['Strategies', '#strategies'], ['Plans', '#plans'],
    ['Referrals', '#referrals'], ['Performance', '#performance'],
  ]

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* NAV */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px clamp(20px,5vw,72px)',
          transition: 'background .4s ease,box-shadow .4s ease,padding .4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(124,58,237,.4)' }}>
            <div style={{ width: 14, height: 14, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 23, letterSpacing: '.2px', color: '#221a33' }}>Lumen</span>
        </div>
        <div data-navlinks style={{ display: 'flex', alignItems: 'center', gap: 34, fontSize: 15, fontWeight: 600, color: '#3a2f52' }}>
          {navItems.map(([label, href]) => (
            <a key={label} href={href} style={{ textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div data-navactions style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#3a2f52', padding: '11px 18px', borderRadius: 999 }}>Sign In</Link>
          <Link to="/signup" style={{ textDecoration: 'none', fontSize: 15, fontWeight: 700, color: '#fff', padding: '12px 24px', borderRadius: 999, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 10px 26px rgba(124,58,237,.34)' }}>Open Account</Link>
        </div>
        {/* mobile hamburger */}
        <button
          type="button"
          data-navtoggle
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'none', width: 46, height: 46, borderRadius: 13, border: '1px solid rgba(124,58,237,.18)', background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(10px)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 5, padding: 0 }}
        >
          <span style={{ width: 20, height: 2.5, borderRadius: 3, background: '#3a2f52', transition: 'transform .35s ease, opacity .35s ease', transform: menuOpen ? 'translateY(7.5px) rotate(45deg)' : 'none' }} />
          <span style={{ width: 20, height: 2.5, borderRadius: 3, background: '#3a2f52', transition: 'opacity .25s ease', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ width: 20, height: 2.5, borderRadius: 3, background: '#3a2f52', transition: 'transform .35s ease', transform: menuOpen ? 'translateY(-7.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 119,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {/* scrim */}
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(27,18,48,.5)', backdropFilter: 'blur(6px)', opacity: menuOpen ? 1 : 0, transition: 'opacity .4s ease' }}
        />
        {/* panel */}
        <div
          style={{
            position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(86vw,360px)',
            background: 'linear-gradient(165deg,#faf7ff 0%,#f3ebff 100%)',
            boxShadow: '-30px 0 80px rgba(85,40,150,.22)',
            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform .5s cubic-bezier(.16,1,.3,1)',
            display: 'flex', flexDirection: 'column', padding: '26px 26px 34px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(124,58,237,.4)' }}>
                <div style={{ width: 13, height: 13, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
              </div>
              <span style={{ fontFamily: serif, fontSize: 22, color: '#221a33' }}>Lumen</span>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(124,58,237,.18)', background: '#fff', color: '#3a2f52', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {navItems.map(([label, href], i) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: 'none', fontFamily: serif, fontSize: 26, color: '#221a33',
                  padding: '14px 0', borderBottom: '1px solid rgba(124,58,237,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'none' : 'translateX(20px)',
                  transition: `opacity .5s ease ${0.12 + i * 0.06}s, transform .5s cubic-bezier(.16,1,.3,1) ${0.12 + i * 0.06}s`,
                }}
              >
                {label}
                <span style={{ fontSize: 16, color: '#a855f7' }}>→</span>
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#3a2f52', padding: '15px 0', borderRadius: 999, background: '#fff', border: '1px solid #ece4fb' }}>Sign In</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', padding: '16px 0', borderRadius: 999, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 14px 30px rgba(124,58,237,.36)' }}>Open Account</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', padding: '150px clamp(20px,5vw,72px) 80px', display: 'flex', alignItems: 'center', background: 'radial-gradient(120% 80% at 80% 0%,#f6ecff 0%,#faf7ff 55%)' }}>
        <div style={{ position: 'absolute', top: '6%', left: '-6%', width: 480, height: 480, background: 'linear-gradient(135deg,#a855f7,#ec4899)', filter: 'blur(20px)', opacity: .34, animation: 'blobMorph 14s ease-in-out infinite, floatA 11s ease-in-out infinite', borderRadius: '45%', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '4%', width: 380, height: 380, background: 'linear-gradient(135deg,#f97316,#ec4899)', filter: 'blur(26px)', opacity: .26, animation: 'blobMorph 17s ease-in-out infinite, floatB 13s ease-in-out infinite', borderRadius: '45%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '40%', left: '42%', width: 240, height: 240, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', filter: 'blur(30px)', opacity: .22, animation: 'floatC 9s ease-in-out infinite', borderRadius: '50%', zIndex: 0 }} />

        <div data-herogrid style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 0, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 16px', borderRadius: 999, background: 'rgba(124,58,237,.09)', border: '1px solid rgba(124,58,237,.18)', fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,.2)' }} />
              Private digital wealth management
            </div>
            <h1 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(46px,5.6vw,82px)', lineHeight: 1.02, letterSpacing: '-.5px', margin: '0 0 24px' }}>
              Wealth, preserved<br />for the <span style={{ fontStyle: 'italic', background: 'linear-gradient(120deg,#7c3aed,#ec4899 60%,#f97316)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>digital age</span>.
            </h1>
            <p data-reveal data-delay="160" style={{ fontSize: 19, lineHeight: 1.6, color: '#5b5172', maxWidth: 520, margin: '0 0 36px' }}>
              For investors who view wealth as something to be managed strategically — not gambled recklessly. Institutional-grade digital asset strategies built on preservation, growth, and income.
            </p>
            <div data-reveal data-delay="240" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 46 }}>
              <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: '#fff', padding: '17px 30px', borderRadius: 999, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 16px 38px rgba(124,58,237,.36)' }}>
                Begin your reserve
                <span style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: '50%', background: '#fff', color: '#7c3aed', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>→</span>
              </Link>
              <a href="#strategies" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 16, fontWeight: 700, color: '#3a2f52', padding: '17px 28px', borderRadius: 999, background: '#fff', border: '1px solid #ece4fb', boxShadow: '0 8px 22px rgba(124,58,237,.07)' }}>
                Explore strategies
              </a>
            </div>
            <div data-reveal data-delay="320" style={{ display: 'flex', gap: 34, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 30, color: '#221a33' }}>$<span data-count="4.8" data-dec="1">0</span>B</div>
                <div style={{ fontSize: 13, color: '#8a7fa3', fontWeight: 600 }}>Assets under guidance</div>
              </div>
              <div style={{ width: 1, background: '#e6ddf6' }} />
              <div>
                <div style={{ fontFamily: serif, fontSize: 30, color: '#221a33' }}><span data-count="12000">0</span>+</div>
                <div style={{ fontSize: 13, color: '#8a7fa3', fontWeight: 600 }}>Investors served</div>
              </div>
              <div style={{ width: 1, background: '#e6ddf6' }} />
              <div>
                <div style={{ fontFamily: serif, fontSize: 30, color: '#221a33' }}><span data-count="38">0</span></div>
                <div style={{ fontSize: 13, color: '#8a7fa3', fontWeight: 600 }}>Countries</div>
              </div>
            </div>
          </div>

          <div data-reveal data-delay="200" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -30, background: 'linear-gradient(135deg,rgba(124,58,237,.16),rgba(236,72,153,.16))', filter: 'blur(30px)', borderRadius: 40, zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <img src={heroImg} alt="Lumen app" style={{ width: '150%', marginLeft: '-25%', height: 'auto', display: 'block', filter: 'drop-shadow(0 50px 80px rgba(85,40,150,.4))' }} />
            </div>
            <div style={{ position: 'absolute', top: 34, left: -34, zIndex: 3, background: 'rgba(255,255,255,.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.8)', borderRadius: 18, padding: '16px 20px', boxShadow: '0 20px 44px rgba(85,40,150,.18)', animation: 'floatA 7s ease-in-out infinite' }}>
              <div style={{ fontSize: 12, color: '#8a7fa3', fontWeight: 600 }}>Portfolio value</div>
              <div style={{ fontFamily: serif, fontSize: 26, color: '#221a33' }}>$527,639</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>▲ 18.4% this quarter</div>
            </div>
            <div style={{ position: 'absolute', bottom: 30, right: -26, zIndex: 3, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 18, padding: '16px 20px', boxShadow: '0 20px 44px rgba(124,58,237,.4)', color: '#fff', animation: 'floatB 8s ease-in-out infinite' }}>
              <div style={{ fontSize: 12, opacity: .85, fontWeight: 600 }}>Annual yield</div>
              <div style={{ fontFamily: serif, fontSize: 26 }}>7.2%</div>
              <div style={{ fontSize: 12, opacity: .9 }}>Staking + infrastructure</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ padding: '38px 0', borderTop: '1px solid #efe8fb', borderBottom: '1px solid #efe8fb', background: '#fff', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a89cc4', fontWeight: 700, margin: '0 0 26px' }}>Trusted by institutions &amp; their advisors</p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 26s linear infinite', gap: 72, alignItems: 'center', opacity: .7 }}>
          {[0, 1].map((rep) => (
            <span key={rep} style={{ display: 'contents' }}>
              <span style={{ fontFamily: serif, fontSize: 26, color: '#3a2f52', whiteSpace: 'nowrap' }}>Lumina Capital</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: '#3a2f52', letterSpacing: '-.5px' }}>VORTEX</span>
              <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 26, color: '#3a2f52' }}>Meridian&nbsp;Trust</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: '#3a2f52' }}>Velocity●</span>
              <span style={{ fontFamily: serif, fontSize: 26, color: '#3a2f52' }}>Synergy&nbsp;Partners</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: '#3a2f52', letterSpacing: 1 }}>ENIGMA</span>
            </span>
          ))}
        </div>
      </section>

      {/* LIVE STATS + PAYOUT TICKER */}
      <section style={{ position: 'relative', padding: 'clamp(56px,7vh,84px) clamp(20px,5vw,72px) 0', background: '#faf7ff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-reveal style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,.2)' }} />
            <span style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800 }}>Live platform activity</span>
          </div>
          <div data-livestats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {[
              { grad: 'linear-gradient(120deg,#7c3aed,#a855f7)', value: <>$<span data-count="312.4" data-dec="1">0</span>M</>, label: 'Total deposits processed', delay: undefined },
              { grad: 'linear-gradient(120deg,#ec4899,#f97316)', value: <>$<span data-count="248.9" data-dec="1">0</span>M</>, label: 'Total withdrawals paid', delay: 90 },
              { grad: 'linear-gradient(120deg,#a855f7,#ec4899)', value: <><span data-count="48217">0</span></>, label: 'Registered investors', delay: 180 },
              { grad: 'linear-gradient(120deg,#f97316,#fbbf24)', value: <><span data-count="2184">0</span></>, label: 'Days online', delay: 270 },
            ].map((s, i) => (
              <div key={i} data-reveal data-delay={s.delay || undefined} style={{ textAlign: 'center', padding: '28px 16px', borderRadius: 20, background: '#fff', border: '1px solid #f0e9fb', boxShadow: '0 16px 40px rgba(124,58,237,.06)' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(30px,3.4vw,42px)', background: s.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#8a7fa3', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* recent payouts marquee */}
          <div data-reveal data-delay="120" style={{ marginTop: 26, borderRadius: 18, border: '1px solid #f0e9fb', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px rgba(255,255,255,.3)' }} /> Latest payouts
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 34s linear infinite', gap: 40, padding: '12px 0' }}>
                {[0, 1].map((rep) => (
                  <span key={rep} style={{ display: 'flex', gap: 40 }}>
                    {[
                      ['A. Morgan', 'United Kingdom', '$4,820'],
                      ['L. Nakamura', 'Singapore', '$12,400'],
                      ['R. Okafor', 'Nigeria', '$2,310'],
                      ['S. Almeida', 'Portugal', '$28,950'],
                      ['J. Weber', 'Germany', '$7,640'],
                      ['M. Chen', 'United States', '$54,200'],
                      ['K. Haddad', 'UAE', '$19,075'],
                    ].map(([n, c, amt], i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 14, whiteSpace: 'nowrap', color: '#3a2f52' }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>▲</span>
                        <strong>{n}</strong>
                        <span style={{ color: '#a89cc4' }}>· {c} ·</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{amt}</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section id="story" style={{ position: 'relative', padding: 'clamp(90px,12vh,150px) clamp(20px,5vw,72px)', background: 'radial-gradient(100% 70% at 50% 0%,#f6ecff,#faf7ff 70%)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 18 }}>The Lumen Reserve</div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.4vw,60px)', lineHeight: 1.1, letterSpacing: '-.5px', margin: '0 0 28px' }}>
            For generations, wealth was preserved through scarce assets.<br /><span style={{ fontStyle: 'italic', color: '#7c3aed' }}>Today, a new asset class has emerged.</span>
          </h2>
          <p data-reveal data-delay="140" style={{ fontSize: 19, lineHeight: 1.7, color: '#5b5172', margin: '0 auto 22px', maxWidth: 720 }}>
            Digital assets have become one of the fastest-growing stores of value in modern history — attracting institutions, public companies, hedge funds, and some of the world's most successful investors. Yet most individuals remain locked out. Not for lack of capital, but for lack of access.
          </p>
          <p data-reveal data-delay="200" style={{ fontSize: 19, lineHeight: 1.7, color: '#5b5172', margin: '0 auto', maxWidth: 720 }}>
            Navigating the digital asset economy requires specialized knowledge, advanced security, constant monitoring, and access to opportunities rarely available to the public. <strong style={{ color: '#221a33' }}>Lumen was created to bridge that gap.</strong>
          </p>
        </div>
      </section>

      {/* THREE PRINCIPLES */}
      <section style={{ padding: '0 clamp(20px,5vw,72px) clamp(80px,10vh,130px)', background: '#faf7ff' }}>
        <div data-principles style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { delay: 0, num: '01', numColor: '#a855f7', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', shadow: 'rgba(124,58,237,.06)', iconShadow: 'rgba(124,58,237,.3)', blob: 'linear-gradient(135deg,#7c3aed,#a855f7)', icon: <div style={{ width: 22, height: 22, border: '3px solid #fff', borderRadius: 6 }} />, title: 'Capital Preservation', text: 'Protect wealth through disciplined allocation and risk-managed exposure to assets with proven liquidity.' },
            { delay: 120, num: '02', numColor: '#ec4899', grad: 'linear-gradient(135deg,#ec4899,#f97316)', shadow: 'rgba(236,72,153,.07)', iconShadow: 'rgba(236,72,153,.3)', blob: 'linear-gradient(135deg,#ec4899,#f97316)', icon: <div style={{ width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderBottom: '18px solid #fff' }} />, title: 'Sustainable Growth', text: 'Participate in long-term digital asset appreciation rather than short-term speculation or chasing trends.' },
            { delay: 240, num: '03', numColor: '#f97316', grad: 'linear-gradient(135deg,#f97316,#fbbf24)', shadow: 'rgba(249,115,22,.07)', iconShadow: 'rgba(249,115,22,.3)', blob: 'linear-gradient(135deg,#f97316,#fbbf24)', icon: <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #fff' }} />, title: 'Income Generation', text: 'Unlock passive returns through staking networks, blockchain infrastructure, and yield-producing assets.' },
          ].map((p) => (
            <div key={p.num} data-reveal data-delay={p.delay || undefined} style={{ background: '#fff', borderRadius: 26, padding: '38px 32px', border: '1px solid #f0e9fb', boxShadow: `0 20px 50px ${p.shadow}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: p.blob, opacity: .1, borderRadius: '50%' }} />
              <div style={{ fontFamily: serif, fontSize: 15, color: p.numColor, marginBottom: 24 }}>{p.num}</div>
              <div style={{ width: 54, height: 54, borderRadius: 15, background: p.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: `0 12px 26px ${p.iconShadow}` }}>{p.icon}</div>
              <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 27, margin: '0 0 12px' }}>{p.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: '#5b5172', margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOUR PILLARS (chapters) */}
      <section id="journey" style={{ padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: '#faf7ff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ marginBottom: 60 }}>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(36px,4vw,48px)', fontWeight: 400, margin: '0 0 14px', color: '#1f1830', lineHeight: 1.1 }}>The four pillars</h2>
            <p style={{ fontSize: 18, color: '#564c6e', lineHeight: 1.6, margin: 0, maxWidth: 580 }}>Our philosophy is built on four core principles that guide every decision we make for your reserve.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 28 }}>
            {[
              { ch: 'Ch. 01', grad: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)', rot: 'rotateX(10deg) rotateZ(-2deg)', shadow: 'rgba(124,58,237,.3)', title: 'Own the infrastructure.', text: 'Digital assets are transforming ownership with confidence & clarity.', link: 'Philosophy →', delay: '0s' },
              { ch: 'Ch. 02', grad: 'linear-gradient(135deg,#ec4899 0%,#f97316 100%)', rot: 'rotateX(8deg) rotateZ(3deg)', shadow: 'rgba(236,72,153,.3)', title: 'Structured around liquidity.', text: 'Institutional adoption & long-term relevance — never trends.', link: 'Strategy →', delay: '120ms' },
              { ch: 'Ch. 03', grad: 'linear-gradient(135deg,#14b8a6 0%,#06b6d4 100%)', rot: 'rotateX(10deg) rotateZ(-2deg)', shadow: 'rgba(20,184,166,.3)', title: 'Guarded like a vault.', text: 'Institutional custody, multi-sig protection, 99.9% uptime.', link: 'Security →', delay: '240ms' },
              { ch: 'Ch. 04', grad: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)', rot: 'rotateX(8deg) rotateZ(3deg)', shadow: 'rgba(245,158,11,.3)', title: 'Next-gen wealth.', text: 'Own the infrastructure of the future with confidence & clarity.', link: 'Vision →', delay: '360ms' },
            ].map((c, i) => (
              <div key={i} data-chapter style={{ position: 'relative', height: 360, transformStyle: 'preserve-3d', animation: `chapterReveal 0.8s cubic-bezier(.16,1,.3,1) ${c.delay} forwards`, opacity: 0 }}>
                <div style={{ position: 'absolute', inset: 0, background: c.grad, borderRadius: 24, transform: c.rot, boxShadow: `0 40px 80px ${c.shadow}, inset -1px -1px 20px rgba(0,0,0,.18)`, padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', fontWeight: 700, marginBottom: 14 }}>{c.ch}</div>
                    <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: '0 0 12px', lineHeight: 1.1 }}>{c.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, opacity: .88 }}>{c.text}</p>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{c.link}</div>
                </div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'linear-gradient(to bottom,rgba(255,255,255,.1),transparent)', pointerEvents: 'none' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGY CARDS */}
      <section id="strategies" style={{ padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: '#faf7ff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ maxWidth: 680, marginBottom: 54 }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>Investment strategies</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: 0 }}>Premium strategies, structured like private reports.</h2>
          </div>
          <div data-strategy-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }}>
            {[
              { id: 'report-1', slot: 'lumen-s1', cardBg: 'linear-gradient(165deg,#f1e9fe,#fbf8ff)', border: '#e7dafb', shadow: 'rgba(124,58,237,.1)', tag: 'CORE RESERVE', tagBg: 'rgba(124,58,237,.12)', tagColor: '#7c3aed', title: 'The Preservation Portfolio', text: 'A conservative allocation across the most liquid, institutionally-adopted digital assets. Built to weather volatility.', yield: '4.1%', yieldColor: '#7c3aed', risk: 'Low', accent: '#7c3aed', delay: undefined },
              { id: 'report-2', slot: 'lumen-s2', cardBg: 'linear-gradient(165deg,#ffe7f1,#fff6fb)', border: '#fbd6e7', shadow: 'rgba(236,72,153,.1)', tag: 'GROWTH', tagBg: 'rgba(236,72,153,.12)', tagColor: '#ec4899', title: 'The Appreciation Mandate', text: 'Long-term exposure to assets positioned for structural adoption. Designed for compounding over market cycles.', yield: '11.6%', yieldColor: '#ec4899', risk: 'Medium', accent: '#ec4899', delay: 120 },
              { id: 'report-3', slot: 'lumen-s3', cardBg: 'linear-gradient(165deg,#ffefe0,#fffaf4)', border: '#fdddc1', shadow: 'rgba(249,115,22,.1)', tag: 'INCOME', tagBg: 'rgba(249,115,22,.14)', tagColor: '#f97316', title: 'The Yield Engine', text: 'Passive returns generated through staking networks and yield-producing blockchain infrastructure.', yield: '7.2%', yieldColor: '#f97316', risk: 'Low–Med', accent: '#f97316', delay: 80 },
            ].map((s) => (
              <StrategyCard key={s.id} {...s} onOpen={() => openReport(s.id)} />
            ))}
            {/* bespoke card */}
            <StrategyCard
              id="report-4"
              bespoke
              onOpen={() => openReport('report-4')}
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* INVESTMENT PLANS (tiered) */}
      <section id="plans" style={{ position: 'relative', padding: 'clamp(80px,10vh,130px) clamp(20px,5vw,72px)', background: 'radial-gradient(90% 70% at 80% 0%,#f6ecff,#faf7ff 65%)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 54px' }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>Investment plans</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, margin: '0 0 16px' }}>Choose the reserve tier that fits your capital.</h2>
            <p data-reveal data-delay="140" style={{ fontSize: 17, lineHeight: 1.6, color: '#5b5172', margin: 0 }}>Every tier is fully insured, multi-signature secured, and accrues yield daily. Upgrade or compound at any time.</p>
          </div>
          <div data-plans-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {[
              { name: 'Starter', roi: '10%', period: 'after 30 days', min: '$500', max: '$2,999', accent: '#7c3aed', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', featured: false, perks: ['Daily yield accrual', 'Capital returned at term', 'Standard email support', 'Mobile portfolio access'], delay: undefined },
              { name: 'Pro', roi: '25%', period: 'after 45 days', min: '$3,000', max: '$9,999', accent: '#ec4899', grad: 'linear-gradient(135deg,#ec4899,#f97316)', featured: true, perks: ['Everything in Starter', 'Priority withdrawals', 'Quarterly rebalancing', 'Dedicated account manager'], delay: 90 },
              { name: 'Shares', roi: '50%', period: 'after 60 days', min: '$10,000', max: '$49,999', accent: '#f97316', grad: 'linear-gradient(135deg,#f97316,#fbbf24)', featured: false, perks: ['Everything in Pro', 'Reduced performance fee', 'Private market access', 'Monthly strategy call'], delay: 180 },
              { name: 'Silver', roi: '70%', period: 'after 90 days', min: '$50,000', max: 'No limit', accent: '#a855f7', grad: 'linear-gradient(135deg,#7c3aed,#ec4899)', featured: false, perks: ['Everything in Shares', 'Bespoke allocation', 'Dedicated wealth advisor', 'In-person reviews'], delay: 270 },
            ].map((p) => (
              <PlanCard key={p.name} {...p} />
            ))}
          </div>
          <p data-reveal style={{ textAlign: 'center', fontSize: 13, color: '#a89cc4', marginTop: 28 }}>Returns shown are target figures based on historical strategy performance. Digital assets carry risk; capital is not guaranteed.</p>
        </div>
      </section>

      {/* REFERRAL / COMMISSION TIERS */}
      <section id="referrals" style={{ position: 'relative', padding: 'clamp(80px,10vh,130px) clamp(20px,5vw,72px)', background: '#1b1230', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 420, height: 420, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', filter: 'blur(80px)', opacity: .26, borderRadius: '50%', animation: 'floatB 15s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto' }}>
          <div data-appgrid style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c4a8ff', fontWeight: 800, marginBottom: 16 }}>Partner program</div>
              <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1, color: '#fff', margin: '0 0 20px' }}>Earn across three tiers of referrals.</h2>
              <p data-reveal data-delay="140" style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,.7)', margin: '0 0 30px', maxWidth: 460 }}>Invite investors to Lumen and earn a recurring commission on their deposits — and on the deposits of everyone they bring in, up to three levels deep.</p>
              <div data-reveal data-delay="200" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <div><div style={{ fontFamily: serif, fontSize: 30, color: '#fff' }}>$<span data-count="6.2" data-dec="1">0</span>M</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>Paid to partners</div></div>
                <div style={{ width: 1, background: 'rgba(255,255,255,.14)' }} />
                <div><div style={{ fontFamily: serif, fontSize: 30, color: '#fff' }}><span data-count="3900">0</span>+</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>Active partners</div></div>
              </div>
            </div>
            <div data-referral-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { lvl: 'Level 1', desc: 'Direct referrals', rate: '2%', grad: 'linear-gradient(150deg,#7c3aed,#a855f7)', delay: undefined },
                { lvl: 'Level 2', desc: 'Their referrals', rate: '3%', grad: 'linear-gradient(150deg,#ec4899,#f97316)', delay: 110 },
                { lvl: 'Level 3', desc: 'Extended network', rate: '5%', grad: 'linear-gradient(150deg,#f97316,#fbbf24)', delay: 220 },
              ].map((r) => (
                <div key={r.lvl} data-reveal data-delay={r.delay || undefined} style={{ borderRadius: 22, padding: '30px 22px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', textAlign: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: r.grad, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, color: '#fff', fontWeight: 700 }}>{r.lvl.split(' ')[1]}</div>
                  <div style={{ fontFamily: serif, fontSize: 'clamp(34px,4vw,46px)', background: r.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>{r.rate}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 8 }}>{r.lvl}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.72)', marginTop: 4 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS GRID + TRUST METERS */}
      <section style={{ position: 'relative', padding: 'clamp(80px,10vh,130px) clamp(20px,5vw,72px)', background: '#faf7ff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 54px' }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>Why Lumen</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, margin: 0 }}>Built for trust, engineered for returns.</h2>
          </div>
          <div data-benefits-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginBottom: 56 }}>
            {[
              { icon: '◆', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', title: 'High, stable income', text: 'Target returns from 10% to 70% across tiers, backed by disciplined, risk-managed strategies.', delay: undefined },
              { icon: '⊕', grad: 'linear-gradient(135deg,#ec4899,#f97316)', title: 'Worldwide operations', text: 'Serving investors in 38 countries with full multi-currency deposit and withdrawal support.', delay: 80 },
              { icon: '↻', grad: 'linear-gradient(135deg,#f97316,#fbbf24)', title: '24/7 instant payouts', text: 'Withdraw any time — automated settlement processes requests around the clock, every day.', delay: 160 },
              { icon: '☎', grad: 'linear-gradient(135deg,#a855f7,#ec4899)', title: 'Dedicated support', text: 'A real human team and dedicated account managers for Pro tier and above.', delay: undefined },
              { icon: '🔒', grad: 'linear-gradient(135deg,#7c3aed,#ec4899)', title: 'SSL & DDoS protected', text: 'Bank-grade encryption, multi-signature custody, and enterprise DDoS mitigation on every layer.', delay: 80 },
              { icon: '⊞', grad: 'linear-gradient(135deg,#ec4899,#f97316)', title: 'Multiple payment rails', text: 'Fund and withdraw via bank transfer, card, and major digital assets — your choice.', delay: 160 },
            ].map((b) => (
              <div key={b.title} data-reveal data-delay={b.delay || undefined} style={{ background: '#fff', borderRadius: 22, padding: '30px 28px', border: '1px solid #f0e9fb', boxShadow: '0 16px 44px rgba(124,58,237,.05)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: b.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', marginBottom: 18, boxShadow: '0 12px 26px rgba(124,58,237,.22)' }}>{b.icon}</div>
                <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 23, margin: '0 0 10px' }}>{b.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#5b5172', margin: 0 }}>{b.text}</p>
              </div>
            ))}
          </div>
          {/* trust meters */}
          <div data-trust-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28, maxWidth: 980, margin: '0 auto' }}>
            {[
              { label: 'UK & US registered company', pct: 100, grad: 'linear-gradient(90deg,#7c3aed,#a855f7)', delay: undefined },
              { label: 'Reliability & profitability', pct: 99, grad: 'linear-gradient(90deg,#ec4899,#f97316)', delay: 120 },
              { label: 'Professional, dedicated team', pct: 100, grad: 'linear-gradient(90deg,#f97316,#fbbf24)', delay: 240 },
            ].map((t) => (
              <TrustMeter key={t.label} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* REPORT OVERLAY */}
      {activeReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'block' }}>
          <div onClick={closeReport} style={{ position: 'absolute', inset: 0, background: 'rgba(27,18,48,.55)', backdropFilter: 'blur(8px)', opacity: shown ? 1 : 0, transition: 'opacity .4s ease' }} />
          <Report data={reportData[activeReport]} shown={shown} onClose={closeReport} />
        </div>
      )}

      {/* PERFORMANCE / STATS */}
      <section id="performance" style={{ position: 'relative', padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: '#1b1230', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(34,26,51,.86),rgba(27,18,48,.92))', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 420, height: 420, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', filter: 'blur(70px)', opacity: .3, borderRadius: '50%', animation: 'floatA 13s ease-in-out infinite', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 60px' }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c4a8ff', fontWeight: 800, marginBottom: 16 }}>By the numbers</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, color: '#fff', margin: 0 }}>Performance built on discipline.</h2>
          </div>
          <div data-stats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {[
              { grad: 'linear-gradient(120deg,#a855f7,#ec4899)', value: <>$<span data-count="4.8" data-dec="1">0</span>B</>, label: 'Assets under guidance', delay: undefined },
              { grad: 'linear-gradient(120deg,#ec4899,#f97316)', value: <><span data-count="99.9" data-dec="1">0</span>%</>, label: 'Custody uptime', delay: 100 },
              { grad: 'linear-gradient(120deg,#a855f7,#ec4899)', value: <><span data-count="12000">0</span>+</>, label: 'Investors served', delay: 200 },
              { grad: 'linear-gradient(120deg,#ec4899,#f97316)', value: <><span data-count="38">0</span></>, label: 'Countries served', delay: 300 },
            ].map((s, i) => (
              <div key={i} data-reveal data-delay={s.delay || undefined} style={{ textAlign: 'center', padding: '36px 20px', borderRadius: 22, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(40px,5vw,60px)', background: s.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <section style={{ padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: '#faf7ff' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>The journey</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, margin: 0 }}>How wealth compounds over time.</h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: 42 }}>
            <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 3, background: 'linear-gradient(180deg,#7c3aed,#ec4899,#f97316)', borderRadius: 3 }} />
            {[
              { dot: '#7c3aed', dotShadow: 'rgba(124,58,237,.12)', cardShadow: 'rgba(124,58,237,.06)', kicker: 'Year 01 — Foundation', kColor: '#7c3aed', title: 'Establish your reserve', text: 'We assess your goals, risk tolerance, and time horizon, then construct your initial allocation across preservation, growth, and income.', dark: false, delay: undefined },
              { dot: '#ec4899', dotShadow: 'rgba(236,72,153,.12)', cardShadow: 'rgba(236,72,153,.06)', kicker: 'Years 02–05 — Compounding', kColor: '#ec4899', title: 'Reinvest and rebalance', text: 'Yield is automatically reinvested. Quarterly rebalancing keeps your portfolio aligned with the evolving digital economy.', dark: false, delay: 120 },
              { dot: '#f97316', dotShadow: 'rgba(249,115,22,.12)', cardShadow: 'rgba(124,58,237,.28)', kicker: 'Year 10+ — Legacy', kColor: 'rgba(255,255,255,.85)', title: 'A reserve that outlasts cycles', text: 'Your reserve becomes a generational store of value — built on the infrastructure of the future, preserved with discipline.', dark: true, delay: 240 },
            ].map((t, i) => (
              <div key={i} data-reveal data-delay={t.delay || undefined} style={{ position: 'relative', marginBottom: i < 2 ? 42 : 0 }}>
                <div style={{ position: 'absolute', left: -42, top: 2, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: `3px solid ${t.dot}`, boxShadow: `0 0 0 5px ${t.dotShadow}` }} />
                <div style={{ background: t.dark ? 'linear-gradient(150deg,#7c3aed,#ec4899)' : '#fff', borderRadius: 22, padding: '28px 30px', border: t.dark ? 'none' : '1px solid #f0e9fb', boxShadow: t.dark ? '0 20px 50px rgba(124,58,237,.28)' : `0 14px 40px ${t.cardShadow}`, color: t.dark ? '#fff' : undefined }}>
                  <div style={{ fontFamily: serif, fontSize: 15, color: t.kColor, marginBottom: 8, opacity: t.dark ? .85 : 1 }}>{t.kicker}</div>
                  <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 24, margin: '0 0 8px' }}>{t.title}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.6, color: t.dark ? undefined : '#5b5172', opacity: t.dark ? .92 : 1, margin: 0 }}>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APP SHOWCASE */}
      <section style={{ position: 'relative', padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: 'radial-gradient(90% 70% at 20% 30%,#f6ecff,#faf7ff 70%)', overflow: 'hidden' }}>
        <div data-appgrid style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>In your pocket</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, letterSpacing: '-.5px', margin: '0 0 22px' }}>Your entire reserve,<br />beautifully in view.</h2>
            <p data-reveal data-delay="160" style={{ fontSize: 18, lineHeight: 1.65, color: '#5b5172', margin: '0 0 30px', maxWidth: 480 }}>Monitor performance, track yield, and adjust your allocation from an interface designed with the same care as your portfolio.</p>
            <div data-reveal data-delay="220" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 440 }}>
              {[
                { grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', title: 'Real-time portfolio tracking', sub: 'Live valuations across every holding.' },
                { grad: 'linear-gradient(135deg,#ec4899,#f97316)', title: 'Automated yield reinvestment', sub: 'Compounding handled for you.' },
                { grad: 'linear-gradient(135deg,#f97316,#fbbf24)', title: 'Bank-grade security', sub: 'Biometric access & multi-sig custody.' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', width: 38, height: 38, borderRadius: 11, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>✓</div>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{f.title}</div><div style={{ fontSize: 14, color: '#8a7fa3' }}>{f.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal data-delay="160" style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 22 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(124,58,237,.16),rgba(236,72,153,.16))', filter: 'blur(40px)', borderRadius: '50%', zIndex: 0 }} />
            <img src={heroImg} alt="Lumen app screens" style={{ position: 'relative', zIndex: 1, width: '130%', maxWidth: 680, height: 'auto', filter: 'drop-shadow(0 50px 80px rgba(85,40,150,.38))', marginLeft: '-15%' }} />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: 'clamp(90px,12vh,140px) clamp(20px,5vw,72px)', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
            <div data-reveal style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: 16 }}>Trusted voices</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.2vw,56px)', lineHeight: 1.1, margin: 0 }}>Why investors choose Lumen.</h2>
          </div>
          <div data-testi style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { dark: false, star: '#f97316', quote: '"Lumen gave me institutional access without the institutional minimums. My reserve has outperformed every traditional allocation I hold."', name: 'Marcus Chen', role: 'Founder & Executive', slot: 'lumen-av1', delay: undefined },
              { dark: true, star: '#ffd27a', quote: '"Finally a digital asset partner that speaks the language of wealth preservation. Sophisticated, secure, and refreshingly clear."', name: 'Sofia Almeida', role: 'Private Investor', slot: 'lumen-av2', delay: 120 },
              { dark: false, star: '#f97316', quote: '"The clarity of their reporting is unmatched. I always know exactly what I own and why. It feels like a true private bank."', name: 'David Okafor', role: 'Business Owner', slot: 'lumen-av3', delay: 240 },
            ].map((t, i) => (
              <div key={i} data-reveal data-delay={t.delay || undefined} style={{ background: t.dark ? 'linear-gradient(150deg,#7c3aed,#ec4899)' : '#faf7ff', borderRadius: 24, padding: '34px 30px', border: t.dark ? 'none' : '1px solid #f0e9fb', color: t.dark ? '#fff' : undefined, boxShadow: t.dark ? '0 24px 56px rgba(124,58,237,.28)' : undefined }}>
                <div style={{ color: t.star, fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>★★★★★</div>
                <p style={{ fontSize: 17, lineHeight: 1.6, color: t.dark ? undefined : '#3a2f52', margin: '0 0 24px', fontStyle: 'italic' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, flex: 'none' }}>
                    <ImageSlot id={t.slot} shape="circle" placeholder="Photo" style={{ width: 48, height: 48 }} />
                  </div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div><div style={{ fontSize: 13, color: t.dark ? undefined : '#8a7fa3', opacity: t.dark ? .85 : 1 }}>{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', padding: 'clamp(90px,12vh,150px) clamp(20px,5vw,72px)', background: 'linear-gradient(150deg,#7c3aed 0%,#ec4899 60%,#f97316 130%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 480, height: 480, background: 'rgba(255,255,255,.12)', filter: 'blur(50px)', borderRadius: '50%', animation: 'floatA 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: 420, height: 420, background: 'rgba(255,255,255,.1)', filter: 'blur(50px)', borderRadius: '50%', animation: 'floatB 14s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 780, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
          <h2 data-reveal style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(38px,5vw,68px)', lineHeight: 1.06, margin: '0 0 22px' }}>Begin building the reserve of your future.</h2>
          <p data-reveal data-delay="100" style={{ fontSize: 19, lineHeight: 1.6, opacity: .92, margin: '0 auto 38px', maxWidth: 560 }}>Join 12,000 investors preserving and growing wealth with confidence, security, and clarity.</p>
          <div data-reveal data-delay="180" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: '#7c3aed', padding: '18px 34px', borderRadius: 999, background: '#fff', boxShadow: '0 16px 40px rgba(0,0,0,.18)' }}>Open your account <span>→</span></Link>
            <Link to="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: 16, fontWeight: 700, color: '#fff', padding: '18px 32px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.5)' }}>Sign in</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', background: 'linear-gradient(180deg,#1b1230 0%,#150e26 100%)', color: 'rgba(255,255,255,.7)', padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,72px) 0', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-6%', width: 480, height: 480, background: 'radial-gradient(circle,rgba(124,58,237,.35),transparent 65%)', filter: 'blur(20px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-8%', width: 460, height: 460, background: 'radial-gradient(circle,rgba(236,72,153,.28),transparent 65%)', filter: 'blur(20px)', borderRadius: '50%' }} />

        <div data-reveal style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto 64px', background: 'linear-gradient(135deg,rgba(124,58,237,.18),rgba(236,72,153,.14))', border: '1px solid rgba(255,255,255,.12)', borderRadius: 28, padding: 'clamp(32px,5vw,52px)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', lineHeight: 1.12, color: '#fff', margin: '0 0 12px' }}>The Reserve Letter</h3>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.66)', margin: 0, maxWidth: 420 }}>A monthly brief on digital asset strategy, market structure, and wealth preservation — written for serious investors.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="email" placeholder="you@example.com" style={{ flex: 1, minWidth: 180, padding: '15px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 15, outline: 'none' }} />
            <button type="submit" style={{ padding: '15px 26px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(124,58,237,.4)' }}>Subscribe</button>
          </form>
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1fr', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(124,58,237,.4)' }}>
                <div style={{ width: 13, height: 13, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
              </div>
              <span style={{ fontFamily: serif, fontSize: 22, color: '#fff' }}>Lumen</span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 300, margin: '0 0 24px' }}>Private digital wealth management for investors who think in generations, not quarters.</p>
            <div style={{ display: 'flex', gap: 11 }}>
              {['𝕏', 'in', '✉'].map((s, i) => (
                <a key={i} href="#" style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: i === 1 ? 13 : 15 }}>{s}</a>
              ))}
            </div>
          </div>
          {[
            { title: 'Strategies', links: [['Preservation', '#strategies'], ['Growth', '#strategies'], ['Income', '#strategies'], ['Bespoke mandates', '#strategies']] },
            { title: 'Company', links: [['Philosophy', '#story'], ['Performance', '#performance'], ['The journey', '#journey'], ['Client login', '/login']] },
            { title: 'Get started', links: [['Open an account', '/signup'], ['Speak with an advisor', '/signup'], ['Help & support', '#']] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 18 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, fontSize: 14 }}>
                {col.links.map(([label, href]) =>
                  href.startsWith('/') ? (
                    <Link key={label} to={href} style={{ textDecoration: 'none' }}>{label}</Link>
                  ) : (
                    <a key={label} href={href} style={{ textDecoration: 'none' }}>{label}</a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ fontFamily: serif, fontSize: 'clamp(80px,18vw,260px)', lineHeight: .9, letterSpacing: '-.02em', background: 'linear-gradient(120deg,rgba(124,58,237,.5),rgba(236,72,153,.42) 55%,rgba(249,115,22,.36))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', userSelect: 'none', paddingTop: 18 }}>Lumen</div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto', padding: '24px 0 36px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'rgba(255,255,255,.42)', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <span>© 2026 Lumen Reserve. All rights reserved.</span>
          <span>Digital assets carry risk. Past performance is not indicative of future results.</span>
        </div>
      </footer>
    </div>
  )
}

function StrategyCard({ slot, cardBg, border, shadow, tag, tagBg, tagColor, title, text, yield: yld, yieldColor, risk, accent, bespoke, delay, onOpen }) {
  const [hover, setHover] = useState(false)
  const lift = hover ? { transform: 'translateY(-8px)', boxShadow: '0 36px 80px rgba(124,58,237,.18)' } : {}

  if (bespoke) {
    return (
      <div
        data-reveal data-delay={delay || undefined}
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(150deg,#7c3aed,#ec4899)', boxShadow: '0 24px 60px rgba(124,58,237,.28)', transition: 'transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s ease', color: '#fff', ...lift }}
      >
        <div style={{ padding: '40px 34px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 230 }}>
          <div>
            <div style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: 999, background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '.05em', marginBottom: 16 }}>BESPOKE</div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 12px' }}>The Private Mandate</h3>
            <p style={{ fontSize: 16, lineHeight: 1.6, opacity: .9, margin: 0 }}>For reserves above $1M, we construct fully bespoke allocations with a dedicated wealth advisor.</p>
          </div>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: '#fff' }}>View full report <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: '#fff', color: '#7c3aed', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>↗</span></div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-reveal data-delay={delay || undefined}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'pointer', background: cardBg, border: `1px solid ${border}`, boxShadow: `0 24px 60px ${shadow}`, transition: 'transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s ease', ...lift }}
    >
      <div style={{ width: '100%', height: 230 }}>
        <ImageSlot id={slot} shape="rect" placeholder="Strategy image" style={{ width: '100%', height: 230 }} />
      </div>
      <div style={{ padding: '30px 30px 34px' }}>
        <div style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: 999, background: tagBg, color: tagColor, fontSize: 12, fontWeight: 700, letterSpacing: '.05em', marginBottom: 16 }}>{tag}</div>
        <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: '0 0 10px' }}>{title}</h3>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: '#5b5172', margin: '0 0 20px' }}>{text}</p>
        <div style={{ display: 'flex', gap: 28, borderTop: `1px solid ${border}`, paddingTop: 18, alignItems: 'center' }}>
          <div><div style={{ fontFamily: serif, fontSize: 24, color: yieldColor }}>{yld}</div><div style={{ fontSize: 12, color: '#8a7fa3', fontWeight: 600 }}>Target yield</div></div>
          <div><div style={{ fontFamily: serif, fontSize: 24, color: '#221a33' }}>{risk}</div><div style={{ fontSize: 12, color: '#8a7fa3', fontWeight: 600 }}>Risk profile</div></div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: accent }}>View full report <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', background: accent, color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>↗</span></div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ name, roi, period, min, max, accent, grad, featured, perks, delay }) {
  const [hover, setHover] = useState(false)
  const lift = hover ? { transform: 'translateY(-8px)' } : {}
  return (
    <div
      data-reveal data-delay={delay || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', borderRadius: 26, overflow: 'hidden',
        background: featured ? grad : '#fff',
        border: featured ? 'none' : '1px solid #f0e9fb',
        boxShadow: featured ? '0 30px 70px rgba(236,72,153,.34)' : '0 20px 50px rgba(124,58,237,.07)',
        color: featured ? '#fff' : undefined,
        transition: 'transform .5s cubic-bezier(.16,1,.3,1)',
        display: 'flex', flexDirection: 'column',
        ...lift,
      }}
    >
      {featured && (
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,.22)', padding: '5px 11px', borderRadius: 999 }}>Most popular</div>
      )}
      <div style={{ padding: '32px 28px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 22, marginBottom: 18, color: featured ? '#fff' : '#221a33' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: serif, fontSize: 'clamp(46px,5.5vw,62px)', lineHeight: 1, ...(featured ? { color: '#fff' } : { background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }) }}>{roi}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: featured ? 'rgba(255,255,255,.8)' : '#8a7fa3' }}>ROI</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: featured ? 'rgba(255,255,255,.8)' : '#8a7fa3', marginTop: 4 }}>{period}</div>
      </div>
      <div style={{ padding: '0 28px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '14px 0', borderTop: featured ? '1px solid rgba(255,255,255,.2)' : '1px solid #f0e9fb', borderBottom: featured ? '1px solid rgba(255,255,255,.2)' : '1px solid #f0e9fb' }}>
          <div><div style={{ color: featured ? 'rgba(255,255,255,.7)' : '#8a7fa3', fontWeight: 600 }}>Minimum</div><div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : '#221a33' }}>{min}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ color: featured ? 'rgba(255,255,255,.7)' : '#8a7fa3', fontWeight: 600 }}>Maximum</div><div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : '#221a33' }}>{max}</div></div>
        </div>
      </div>
      <div style={{ padding: '0 28px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {perks.map((p) => (
            <div key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: featured ? 'rgba(255,255,255,.92)' : '#5b5172' }}>
              <span style={{ flex: 'none', width: 18, height: 18, borderRadius: '50%', background: featured ? 'rgba(255,255,255,.22)' : 'rgba(124,58,237,.1)', color: featured ? '#fff' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, marginTop: 1 }}>✓</span>
              {p}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '24px 28px 30px' }}>
        <Link to="/signup" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 700, padding: '14px 0', borderRadius: 999, background: featured ? '#fff' : grad, color: featured ? accent : '#fff', boxShadow: featured ? '0 12px 30px rgba(0,0,0,.16)' : `0 12px 28px rgba(124,58,237,.3)` }}>
          Choose {name} <span>→</span>
        </Link>
      </div>
    </div>
  )
}

function TrustMeter({ label, pct, grad, delay }) {
  const ref = useRef(null)
  const [fill, setFill] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setFill(true); io.unobserve(e.target) } }),
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} data-reveal data-delay={delay || undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#3a2f52' }}>{label}</span>
        <span style={{ fontFamily: serif, fontSize: 22, background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{pct}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: '#ece4fb', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: grad, width: fill ? `${pct}%` : '0%', transition: 'width 1.4s cubic-bezier(.16,1,.3,1) .1s' }} />
      </div>
    </div>
  )
}

function Report({ data, shown, onClose }) {
  if (!data) return null
  const imageBlock = (
    <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.14)' }}>
      <ImageSlot id={data.slot} shape="rounded" radius={26} placeholder="Report image" style={{ width: '100%', height: 480 }} />
    </div>
  )
  const textBlock = (
    <div>
      <div style={{ display: 'inline-flex', padding: '7px 15px', borderRadius: 999, background: data.tagBg, color: data.tagColor, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', marginBottom: 22 }}>{data.tag}</div>
      <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(38px,4.5vw,60px)', lineHeight: 1.05, color: '#fff', margin: '0 0 20px' }}>{data.title}</h2>
      <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,.75)', margin: '0 0 30px' }}>{data.desc}</p>
      {data.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {data.stats.map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 18 }}>
              <div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 34 }}>
        {data.bullets.map((b) => (
          <div key={b} style={{ display: 'flex', gap: 11, alignItems: 'center', color: 'rgba(255,255,255,.85)', fontSize: 15 }}><span style={{ color: data.bulletColor }}>●</span> {b}</div>
        ))}
      </div>
      <Link to="/signup" onClick={onClose} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: data.ctaColor, padding: '16px 30px', borderRadius: 999, background: '#fff' }}>{data.cta} <span>→</span></Link>
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: data.bg, opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(.94)', transition: 'opacity .5s ease, transform .55s cubic-bezier(.16,1,.3,1)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(28px,5vw,72px)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#fff' }}><span style={{ fontFamily: serif, fontSize: 20 }}>Lumen</span><span style={{ opacity: .5, fontSize: 13 }}>Private Investment Report</span></div>
          <button type="button" onClick={onClose} style={{ width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', flex: 1 }}>
          {data.imageLeft ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
        </div>
      </div>
    </div>
  )
}
