import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listPlans } from '../lib/deposits'
import { subscribe } from '../lib/newsletter'
import ImageSlot from '../components/ImageSlot'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'
import { useReveal, useCountUp } from '../hooks/useReveal'
import {
  ShieldCheck, TrendUp, Coins, Globe, Lightning, Headset, Lock,
  CreditCard, ArrowRight, ArrowUpRight, List, X, CaretRight,
  ChartLineUp, Cube, EnvelopeSimple,
} from '@phosphor-icons/react'

const heroImg = '/uploads/hero-trading-chart.jpg'
const heroImages = [
  '/uploads/hero-trading-chart.jpg',
  '/uploads/hero-bitcoin-screen.jpg',
  '/uploads/hero-crypto-dark.jpg',
  '/uploads/hero-finance-desk.jpg',
  '/uploads/hero-portfolio.jpg',
]

const C = {
  ink: '#111018',
  body: '#3d3450',
  muted: '#8a829a',
  line: '#e8e3f0',
  surface: '#f8f6fc',
  primary: '#6d28d9',
  accent: '#7c3aed',
  white: '#ffffff',
}
const RAD = 6
const serif = "'DM Serif Display',serif"

const reportData = {
  'report-1': {
    tag: 'GROWTH STRATEGY',
    title: 'Growth Portfolio',
    desc: 'Concentrated exposure to Bitcoin and Ethereum — the two most adopted, most liquid digital assets on the planet. Designed for investors seeking maximum long-term capital appreciation through full market cycles.',
    stats: [['BTC + ETH', 'Core assets'], ['High', 'Growth potential'], ['5yr+', 'Ideal horizon']],
    bullets: [
      'Conviction-weighted toward Bitcoin and Ethereum',
      'Quarterly rebalancing to maintain target allocation',
      'Institutional multi-signature custody on all holdings',
    ],
    cta: 'Invest in Growth',
    slot: 'lumen-r1',
    imageLeft: false,
  },
  'report-2': {
    tag: 'BALANCED STRATEGY',
    title: 'Balanced Portfolio',
    desc: 'A diversified mandate combining Bitcoin, Ethereum, and stablecoin yield positions. Engineered to participate in digital asset growth while reducing overall portfolio volatility through income-generating components.',
    stats: [['15%', 'Annual return'], ['Medium', 'Risk profile'], ['Daily', 'Yield accrual']],
    bullets: [
      'Growth exposure through Bitcoin and Ethereum',
      'Stablecoin positions provide downside cushion',
      'Continuous rebalancing to preserve target mix',
    ],
    cta: 'Invest in Balanced',
    slot: 'lumen-r2',
    imageLeft: true,
  },
  'report-3': {
    tag: 'CONSERVATIVE STRATEGY',
    title: 'Conservative Portfolio',
    desc: 'Capital preservation through stablecoin yield opportunities and conservative digital asset exposure. For investors who prioritize consistency and low volatility over aggressive growth.',
    stats: [['9%', 'Annual return'], ['Low', 'Risk profile'], ['Stable', 'Capital base']],
    bullets: [
      'Stablecoin yield positions form the core allocation',
      'Conservative digital asset exposure managed tightly',
      'Capital protection is the primary mandate',
    ],
    cta: 'Invest in Conservative',
    slot: 'lumen-r3',
    imageLeft: false,
  },
  'report-4': {
    tag: 'PRIVATE CLIENT',
    title: 'Private Mandate',
    desc: 'For portfolios above $250,000, we construct a fully bespoke allocation around your specific objectives — paired with a dedicated wealth advisor, private reporting, and quarterly in-person reviews.',
    stats: null,
    bullets: [
      'A dedicated advisor and direct private line',
      'Custom allocation across all three strategies',
      'Quarterly strategy reviews and private reports',
    ],
    cta: 'Speak with an advisor',
    slot: 'lumen-r4',
    imageLeft: true,
  },
}

// Labels are translation keys, resolved at render so they follow the locale.
const navItems = [
  ['nav.philosophy', '#story'], ['nav.strategies', '#strategies'], ['nav.plans', '#plans'],
  ['nav.referrals', '#referrals'], ['nav.performance', '#performance'],
]

export default function LandingPage() {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const navRef = useRef(null)
  const [activeReport, setActiveReport] = useState(null)
  const [shown, setShown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plans, setPlans] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)

  useReveal(rootRef)
  useCountUp(rootRef)

  useEffect(() => {
    // Active plans are readable without a session — the RLS policy allows anon
    // select where active = true, which is what makes this page work signed out.
    listPlans()
      .then((rows) => { if (rows.length) setPlans(rows) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const nav = navRef.current
    const onScroll = () => {
      if (!nav) return
      const sy = window.scrollY || window.pageYOffset
      if (sy > 40) {
        nav.style.boxShadow = '0 8px 32px rgba(17,16,24,.12)'
        nav.style.background = 'rgba(255,255,255,.97)'
      } else {
        nav.style.boxShadow = '0 4px 24px rgba(17,16,24,.07)'
        nav.style.background = 'rgba(255,255,255,.92)'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 5000)
    return () => clearInterval(t)
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

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', overflow: 'hidden', background: C.white, color: C.ink }}>

      {/* NAV */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 1280, zIndex: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px 10px 18px',
          background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(20px)',
          border: `1px solid ${C.line}`,
          borderRadius: 999,
          boxShadow: '0 4px 24px rgba(17,16,24,.07)',
          transition: 'box-shadow .3s ease, background .3s ease',
          minWidth: 0,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 'none' }}>
          <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: 34, height: 34, objectFit: 'contain', flex: 'none' }} />
          <span style={{ fontFamily: serif, fontSize: 19, color: C.ink, letterSpacing: '.2px', whiteSpace: 'nowrap' }}>Keelstone Trust</span>
        </Link>
        <div data-navlinks style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2vw,28px)', fontSize: 13.5, fontWeight: 500, color: C.body, flex: '0 1 auto', overflow: 'hidden' }}>
          {navItems.map(([label, href]) => (
            <a key={label} href={href} style={{ textDecoration: 'none', transition: 'color .2s', whiteSpace: 'nowrap' }} onMouseEnter={(e) => e.target.style.color=C.primary} onMouseLeave={(e) => e.target.style.color=C.body}>{t(label)}</a>
          ))}
        </div>
        <div data-navactions style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          <LanguageSwitcher compact />
          <Link to="/login" style={{ textDecoration: 'none', fontSize: 13.5, fontWeight: 600, color: C.body, padding: '8px 14px', whiteSpace: 'nowrap' }}>{t('common.signIn')}</Link>
          <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#fff', padding: '9px 18px', background: C.primary, borderRadius: RAD, whiteSpace: 'nowrap' }}>
            {t('common.signUp')} <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
        <button
          type="button" data-navtoggle aria-label={t('nav.toggleMenu')} aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'none', width: 40, height: 40, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 20, flex: 'none' }}
        >
          {menuOpen ? <X size={20} color={C.ink} /> : <List size={20} color={C.ink} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 119, pointerEvents: menuOpen ? 'auto' : 'none' }}>
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(17,16,24,.4)', opacity: menuOpen ? 1 : 0, transition: 'opacity .35s ease', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(86vw,320px)', background: '#fff', borderLeft: `1px solid ${C.line}`, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .45s cubic-bezier(.16,1,.3,1)', display: 'flex', flexDirection: 'column', padding: '22px 22px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
              <span style={{ fontFamily: serif, fontSize: 18, color: C.ink }}>Keelstone Trust</span>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 38, height: 38, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: RAD }}><X size={18} color={C.ink} /></button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {navItems.map(([label, href], i) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}
                style={{ textDecoration: 'none', fontFamily: serif, fontSize: 21, color: C.ink, padding: '14px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'none' : 'translateX(14px)', transition: `opacity .4s ease ${0.08 + i * 0.04}s, transform .4s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.04}s` }}>
                {t(label)} <CaretRight size={14} color={C.muted} />
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <LanguageSwitcher style={{ alignSelf: 'stretch' }} />
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 14.5, fontWeight: 600, color: C.body, padding: '13px 0', border: `1px solid ${C.line}`, borderRadius: RAD }}>{t('common.signIn')}</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: '#fff', padding: '14px 0', background: C.primary, borderRadius: RAD }}>{t('common.signUp')}</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '92vh', padding: '160px clamp(18px,5vw,72px) 80px', display: 'flex', alignItems: 'center', background: '#0d0b14', overflow: 'hidden' }}>
        {/* Rotating background photos */}
        {heroImages.map((src, i) => (
          <div key={src} style={{ position: 'absolute', inset: 0, zIndex: 0, transition: 'opacity 1.4s ease', opacity: i === heroIdx ? 1 : 0 }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', opacity: .18 }} />
          </div>
        ))}
        {/* Overlay: dark left-to-right fade so text side stays readable */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(105deg, rgba(13,11,20,.97) 0%, rgba(13,11,20,.84) 50%, rgba(13,11,20,.55) 100%)' }} />
        {/* Very subtle purple tint — kept restrained */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 45% 60% at 0% 65%, rgba(109,40,217,.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div data-herogrid style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 28 }}>
              <ShieldCheck size={13} color="#a78bfa" weight="fill" /> {t('hero.badge')}
            </div>
            <h1 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(46px,5.6vw,82px)', lineHeight: 1.03, letterSpacing: '-.5px', margin: '0 0 24px', color: '#fff' }}>
              {t('hero.title1')}<br /><em style={{ fontStyle: 'italic', color: '#a78bfa' }}>{t('hero.titleEm')}</em><br />{t('hero.title2')}
            </h1>
            <p data-reveal data-delay="160" style={{ fontSize: 17.5, lineHeight: 1.75, color: 'rgba(255,255,255,.62)', maxWidth: 480, margin: '0 0 36px' }}>
              {t('hero.subtitle')}
            </p>
            <div data-reveal data-delay="240" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}>
              <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: '#fff', padding: '15px 28px', background: C.primary, borderRadius: RAD, boxShadow: '0 6px 22px rgba(109,40,217,.5)' }}>
                {t('hero.ctaPrimary')} <ArrowRight size={16} weight="bold" data-flip />
              </Link>
              <a href="#strategies" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.8)', padding: '15px 24px', border: '1px solid rgba(255,255,255,.2)', borderRadius: RAD, backdropFilter: 'blur(8px)' }}>
                {t('hero.ctaSecondary')}
              </a>
            </div>
            <div data-reveal data-delay="320" style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
              {[
                [<>$<span data-count="1.4" data-dec="1">0</span>B</>, t('hero.statAum')],
                [<><span data-count="48000">0</span>+</>, t('hero.statInvestors')],
                [<><span data-count="38">0</span></>, t('hero.statCountries')],
              ].map(([v, l], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
                  {i > 0 && <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.15)' }} />}
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}>{v}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal data-delay="200" style={{ position: 'relative' }}>
            {/* Image: text overlay — no border-radius */}
            <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid rgba(255,255,255,.12)`, boxShadow: '0 16px 48px rgba(0,0,0,.4)' }}>
              <img src={heroImages[(heroIdx + 1) % heroImages.length]} alt="Keelstone Trust dashboard" style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block', transition: 'opacity 1.2s ease' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 24px 24px', background: 'linear-gradient(to top, rgba(10,6,18,.88) 0%, transparent 100%)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{t('hero.livePortfolio')}</div>
                <div style={{ fontFamily: serif, fontSize: 24, color: '#fff', marginBottom: 4 }}>$248,750 · +18.6%</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{t('hero.allTimeReturn')}</div>
              </div>
            </div>
            {/* Floating stat card */}
            <div style={{ position: 'absolute', top: -14, right: -14, zIndex: 3, background: '#fff', border: `1px solid ${C.line}`, padding: '14px 20px', boxShadow: '0 12px 36px rgba(109,40,217,.14)', borderRadius: RAD }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 3 }}>{t('hero.annualReturn')}</div>
              <div style={{ fontFamily: serif, fontSize: 26, color: C.primary }}>+22%</div>
              <div style={{ fontSize: 11, color: C.muted }}>Growth Strategy</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ padding: '28px 0', borderBottom: `1px solid ${C.line}`, background: C.surface, overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, margin: '0 0 22px' }}>{t('trusted.heading')}</p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 34s linear infinite', gap: 72, alignItems: 'center' }}>
          {[0, 1].map((rep) => (
            <span key={rep} style={{ display: 'contents' }}>
              <span style={{ fontFamily: serif, fontSize: 22, color: C.body, whiteSpace: 'nowrap', opacity: .55 }}>Lumina Capital</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: C.body, letterSpacing: '-.5px', opacity: .45 }}>VORTEX</span>
              <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.body, opacity: .55 }}>Meridian&nbsp;Trust</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: C.body, opacity: .45 }}>VELOCITY</span>
              <span style={{ fontFamily: serif, fontSize: 22, color: C.body, opacity: .55 }}>Synergy&nbsp;Partners</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: C.body, letterSpacing: 1, opacity: .45 }}>ENIGMA</span>
              <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.body, opacity: .55 }}>Apex&nbsp;Ventures</span>
            </span>
          ))}
        </div>
      </section>

      {/* LIVE STATS */}
      <section style={{ position: 'relative', padding: 'clamp(54px,7vh,82px) clamp(18px,5vw,72px) 0', background: C.white }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-reveal style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,.2)' }} />
            <span style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted, fontWeight: 700 }}>{t('liveStats.heading')}</span>
          </div>
          <div data-livestats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            {[
              [<>$<span data-count="312.4" data-dec="1">0</span>M</>, t('liveStats.deployed')],
              [<>$<span data-count="248.9" data-dec="1">0</span>M</>, t('liveStats.distributed')],
              [<><span data-count="48217">0</span></>, t('liveStats.registered')],
              [<><span data-count="2184">0</span></>, t('liveStats.days')],
            ].map(([v, l], i) => (
              <div key={i} data-reveal data-delay={i * 80 || undefined} style={{ textAlign: 'center', padding: '32px 16px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', background: '#fff' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(28px,3.4vw,42px)', color: C.ink, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
          <div data-reveal data-delay="120" style={{ marginTop: 16, border: `1px solid ${C.line}`, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', background: 'linear-gradient(135deg,#6d28d9,#c026d3)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <Lightning size={13} weight="fill" /> Latest payouts
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', background: C.surface }}>
              <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 36s linear infinite', gap: 38, padding: '13px 0' }}>
                {[0, 1].map((rep) => (
                  <span key={rep} style={{ display: 'flex', gap: 38 }}>
                    {[
                      ['A. Morgan', 'United Kingdom', '$4,820'],
                      ['L. Nakamura', 'Singapore', '$12,400'],
                      ['S. Almeida', 'Portugal', '$28,950'],
                      ['J. Weber', 'Germany', '$7,640'],
                      ['M. Chen', 'United States', '$54,200'],
                      ['K. Haddad', 'UAE', '$19,075'],
                      ['P. Eriksson', 'Sweden', '$9,300'],
                      ['D. Laurent', 'France', '$33,500'],
                    ].map(([n, c, amt], i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, whiteSpace: 'nowrap', color: C.body }}>
                        <ArrowUpRight size={13} weight="bold" color="#16a34a" />
                        <strong style={{ color: C.ink }}>{n}</strong>
                        <span style={{ color: C.muted }}>· {c} ·</span>
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

      {/* PHILOSOPHY */}
      <section id="story" style={{ position: 'relative', padding: 'clamp(84px,12vh,140px) clamp(18px,5vw,72px)', background: '#fff', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 1, background: 'linear-gradient(90deg,#6d28d9,#c026d3)', display: 'inline-block' }} />
            <span style={{ color: C.primary }}>{t('philosophy.eyebrow')}</span>
            <span style={{ width: 24, height: 1, background: 'linear-gradient(90deg,#c026d3,#6d28d9)', display: 'inline-block' }} />
          </div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.6vw,62px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: '0 0 28px', color: C.ink }}>
            {t('philosophy.title')}<br /><span style={{ fontStyle: 'italic', color: C.primary }}>{t('philosophy.titleEm')}</span>
          </h2>
          <p data-reveal data-delay="140" style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '0 auto 22px', maxWidth: 720 }}>
            {t('philosophy.body1')}
          </p>
          <p data-reveal data-delay="200" style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '0 auto', maxWidth: 720 }}>
            {t('philosophy.body2')} <strong style={{ color: C.ink }}>{t('philosophy.body2Strong')}</strong>
          </p>
        </div>
      </section>

      {/* THREE PRINCIPLES */}
      <section style={{ padding: '0 clamp(18px,5vw,72px) clamp(74px,10vh,120px)', background: '#fff' }}>
        <div data-principles style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
          {[
            { num: '01', Icon: ShieldCheck, title: t('principles.p1Title'), text: t('principles.p1Text'), grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
            { num: '02', Icon: ChartLineUp, title: t('principles.p2Title'), text: t('principles.p2Text'), grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
            { num: '03', Icon: Coins, title: t('principles.p3Title'), text: t('principles.p3Text'), grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
          ].map((p, i) => (
            <div key={p.num} data-reveal data-delay={i * 120 || undefined} style={{ background: '#fff', padding: '40px 32px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', borderTop: '3px solid transparent', backgroundClip: 'padding-box', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.grad }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, background: p.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p.Icon size={24} color="#fff" weight="fill" />
                </div>
                <span style={{ fontFamily: serif, fontSize: 44, color: C.line, lineHeight: 1 }}>{p.num}</span>
              </div>
              <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 27, margin: '0 0 12px', color: C.ink }}>{p.title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: C.body, margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STRATEGY CARDS */}
      <section id="strategies" style={{ padding: 'clamp(84px,12vh,130px) clamp(18px,5vw,72px)', background: C.ink, borderTop: `1px solid rgba(255,255,255,.06)` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ maxWidth: 680, marginBottom: 52 }}>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: 'rgba(167,139,250,.9)' }}>{t('strategies.eyebrow')}</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.06, letterSpacing: '-.5px', margin: 0, color: '#fff' }}>{t('strategies.title')}</h2>
          </div>
          <div data-strategy-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            {[
              { id: 'report-1', slot: 'lumen-s1', tag: 'GROWTH', title: 'Growth Strategy', text: 'Maximum long-term capital appreciation through concentrated Bitcoin and Ethereum exposure. Designed for investors with a long investment horizon.', yieldVal: '+22%', risk: 'Higher' },
              { id: 'report-2', slot: 'lumen-s2', tag: 'BALANCED', title: 'Balanced Strategy', text: 'Growth potential with reduced volatility. Bitcoin, Ethereum, and stablecoin yield products work together to provide balanced digital asset exposure.', yieldVal: '+15%', risk: 'Medium' },
              { id: 'report-3', slot: 'lumen-s3', tag: 'CONSERVATIVE', title: 'Conservative Strategy', text: 'Capital preservation and consistent returns. Stablecoin yield opportunities and conservative digital asset exposure for risk-conscious investors.', yieldVal: '+9%', risk: 'Lower' },
            ].map((s, i) => (
              <StrategyCard key={s.id} {...s} delay={i * 90 || undefined} onOpen={() => openReport(s.id)} />
            ))}
            <StrategyCard id="report-4" bespoke onOpen={() => openReport('report-4')} delay={200} />
          </div>
        </div>
      </section>

      {/* INVESTMENT PLANS */}
      <section id="plans" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: C.surface, borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 52px' }}>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>{t('plans.eyebrow')}</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, margin: '0 0 16px', color: C.ink }}>{t('plans.title')}</h2>
            <p data-reveal data-delay="140" style={{ fontSize: 16.5, lineHeight: 1.65, color: C.body, margin: 0 }}>{t('plans.subtitle')}</p>
          </div>
          <div data-plans-grid style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length || 4, 4)},1fr)`, gap: 16 }}>
            {(plans.length ? plans : FALLBACK_PLANS).map((p, i) => {
              const d = p.data || p
              return <PlanCard key={d.name} plan={d} delay={i * 80 || undefined} />
            })}
          </div>
          <p data-reveal style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, marginTop: 26 }}>{t('plans.disclaimer')}</p>
        </div>
      </section>

      {/* REFERRALS */}
      <section id="referrals" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: 'linear-gradient(145deg,#0a0612 0%,#130a28 50%,#1a0a2e 100%)', color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 80% 50%, rgba(109,40,217,.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-appgrid style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 52, alignItems: 'center' }}>
            <div>
              <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 800, marginBottom: 14 }}>{t('referrals.eyebrow')}</div>
              <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(30px,4vw,50px)', lineHeight: 1.1, color: '#fff', margin: '0 0 18px' }}>{t('referrals.title')}</h2>
              <p data-reveal data-delay="140" style={{ fontSize: 16.5, lineHeight: 1.65, color: 'rgba(255,255,255,.65)', margin: '0 0 28px', maxWidth: 450 }}>{t('referrals.body')}</p>
              <div data-reveal data-delay="200" style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                <div><div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}>$<span data-count="6.2" data-dec="1">0</span>M</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{t('referrals.paidPartners')}</div></div>
                <div style={{ width: 1, background: 'rgba(255,255,255,.14)' }} />
                <div><div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}><span data-count="3900">0</span>+</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{t('referrals.activePartners')}</div></div>
              </div>
            </div>
            <div data-referral-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.14)', borderRadius: RAD, overflow: 'hidden' }}>
              {[
                { lvl: '1', desc: t('referrals.direct'), rate: '2%' },
                { lvl: '2', desc: t('referrals.theirReferrals'), rate: '3%' },
                { lvl: '3', desc: t('referrals.extended'), rate: '5%' },
              ].map((r, i) => (
                <div key={r.lvl} data-reveal data-delay={i * 110 || undefined} style={{ padding: '30px 22px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.14)' : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: RAD, border: '1px solid rgba(255,255,255,.2)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 17, color: '#fff' }}>{r.lvl}</div>
                  <div style={{ fontFamily: serif, fontSize: 'clamp(30px,4vw,42px)', color: C.primary, lineHeight: 1 }}>{r.rate}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 8 }}>Level {r.lvl}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY LUMEN */}
      <section style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff', borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 52px' }}>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>{t('why.eyebrow')}</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, margin: 0, color: C.ink }}>{t('why.title')}</h2>
          </div>
          <div data-benefits-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden', marginBottom: 52 }}>
            {[
              { Icon: TrendUp, title: t('why.b1Title'), text: t('why.b1Text'), grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
              { Icon: Globe, title: t('why.b2Title'), text: t('why.b2Text'), grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
              { Icon: Lightning, title: t('why.b3Title'), text: t('why.b3Text'), grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
              { Icon: Headset, title: t('why.b4Title'), text: t('why.b4Text'), grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
              { Icon: Lock, title: t('why.b5Title'), text: t('why.b5Text'), grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
              { Icon: CreditCard, title: t('why.b6Title'), text: t('why.b6Text'), grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
            ].map((b, i) => (
              <div key={b.title} data-reveal data-delay={(i % 3) * 80 || undefined} style={{ padding: '32px 28px', borderLeft: i % 3 !== 0 ? `1px solid ${C.line}` : 'none', borderTop: i >= 3 ? `1px solid ${C.line}` : 'none', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 50, height: 50, background: b.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <b.Icon size={22} color="#fff" weight="fill" />
                </div>
                <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 22, margin: '0 0 10px', color: C.ink }}>{b.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.body, margin: 0 }}>{b.text}</p>
              </div>
            ))}
          </div>
          <div data-trust-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 26, maxWidth: 980, margin: '0 auto' }}>
            {[
              { label: t('why.trust1'), pct: 100 },
              { label: t('why.trust2'), pct: 99 },
              { label: t('why.trust3'), pct: 100 },
            ].map((t, i) => (
              <TrustMeter key={t.label} {...t} delay={i * 120 || undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* REPORT OVERLAY */}
      {activeReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'block' }}>
          <div onClick={closeReport} style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,18,.6)', opacity: shown ? 1 : 0, transition: 'opacity .4s ease' }} />
          <Report data={reportData[activeReport]} shown={shown} onClose={closeReport} />
        </div>
      )}

      {/* PERFORMANCE */}
      <section id="performance" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: C.ink, borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 30% 50%, rgba(109,40,217,.11) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 52px' }}>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: 'rgba(167,139,250,.9)' }}>{t('track.eyebrow')}</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, color: '#fff', margin: 0 }}>{t('track.title')}</h2>
          </div>
          <div data-stats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
            {[
              [<>$<span data-count="1.4" data-dec="1">0</span>B</>, t('hero.statAum')],
              [<><span data-count="99.9" data-dec="1">0</span>%</>, t('track.uptime')],
              [<><span data-count="48000">0</span>+</>, t('hero.statInvestors')],
              [<><span data-count="38">0</span></>, t('track.countries')],
            ].map(([v, l], i) => (
              <div key={i} data-reveal data-delay={i * 100 || undefined} style={{ textAlign: 'center', padding: '44px 20px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none', background: 'rgba(255,255,255,.03)' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,58px)', color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', fontWeight: 600, marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff', borderTop: `1px solid ${C.line}` }}>
        <div data-appgrid style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>{t('how.eyebrow')}</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: '0 0 24px', color: C.ink }}>{t('how.title')}</h2>
            <div data-reveal data-delay="220" style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 440 }}>
              {[
                { step: '01', title: t('how.s1Title'), sub: t('how.s1Text') },
                { step: '02', title: t('how.s2Title'), sub: t('how.s2Text') },
                { step: '03', title: t('how.s3Title'), sub: t('how.s3Text') },
                { step: '04', title: t('how.s4Title'), sub: t('how.s4Text') },
              ].map((f, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', width: 52 }}>
                    <div style={{ flex: 'none', width: 40, height: 40, background: i === 0 ? 'linear-gradient(135deg,#6d28d9,#c026d3)' : C.surface, border: `1px solid ${i === 0 ? 'transparent' : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 14, color: i === 0 ? '#fff' : C.muted, boxShadow: i === 0 ? '0 6px 20px rgba(109,40,217,.4)' : 'none' }}>{f.step}</div>
                    {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: C.line, marginTop: 6, marginBottom: 6, minHeight: 24 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 20 : 0, paddingLeft: 14, paddingTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5, color: C.ink }}>{f.title}</div>
                    <div style={{ fontSize: 13.5, color: C.muted, marginTop: 3 }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Image with text overlay, no border radius */}
          <div data-reveal data-delay="160" style={{ position: 'relative', overflow: 'hidden' }}>
            <img src="/uploads/hero-finance-desk.jpg" alt="Keelstone Trust investor dashboard" style={{ display: 'block', width: '100%', height: 420, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '50px 26px 26px', background: 'linear-gradient(to top, rgba(10,6,18,.9) 0%, transparent 100%)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>{t('how.imageCaption')}</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: '#fff' }}>{t('how.imageTitle')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CONTACT SUPPORT */}
      <section id="support" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: C.surface, borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-reveal style={{ border: `1px solid ${C.line}`, background: C.white, padding: 'clamp(32px,5vw,56px)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11.5, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 700, color: C.primary, marginBottom: 16 }}>Support</div>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(30px,4vw,50px)', lineHeight: 1.08, margin: '0 0 16px', color: C.ink }}>Need help? Our team is here for you.</h2>
              <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.body, margin: 0, maxWidth: 480 }}>Have a question about your account, an investment plan, or a withdrawal? Reach out to our support team and we'll get back to you promptly.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
              <a href="mailto:contact@keelstone-trust.com" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#fff', padding: '15px 30px', background: C.primary, borderRadius: RAD, boxShadow: '0 4px 20px rgba(109,40,217,.25)' }}>
                <EnvelopeSimple size={18} weight="bold" /> {t('finalCta.contactSupport')}
              </a>
              <a href="mailto:contact@keelstone-trust.com" style={{ textDecoration: 'none', fontSize: 14.5, fontWeight: 600, color: C.muted }}>contact@keelstone-trust.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', padding: 'clamp(84px,12vh,140px) clamp(18px,5vw,72px)', background: C.ink, color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-8%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>{t('finalCta.eyebrow')}</div>
          <h2 data-reveal data-delay="60" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,5vw,64px)', lineHeight: 1.06, margin: '0 0 20px' }}>{t('finalCta.title')}</h2>
          <p data-reveal data-delay="120" style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', margin: '0 auto 36px', maxWidth: 500 }}>{t('finalCta.body')}</p>
          <div data-reveal data-delay="180" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: '#fff', padding: '15px 30px', background: C.primary, borderRadius: RAD }}>Open Your Account <ArrowRight size={16} weight="bold" /></Link>
            <Link to="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.75)', padding: '15px 28px', border: '1px solid rgba(255,255,255,.18)', borderRadius: RAD }}>Sign in</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', background: C.ink, color: 'rgba(255,255,255,.6)', padding: 'clamp(56px,8vh,88px) clamp(18px,5vw,72px) 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        {/* Newsletter strip */}
        <div data-reveal style={{ maxWidth: 1240, margin: '0 auto 56px', border: '1px solid rgba(255,255,255,.08)', padding: 'clamp(28px,5vw,48px)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 36, alignItems: 'center', background: 'rgba(255,255,255,.03)' }}>
          <div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(26px,3.2vw,38px)', lineHeight: 1.1, color: '#fff', margin: '0 0 10px' }}>{t('footer.newsletterTitle')}</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.55)', margin: 0, maxWidth: 420 }}>{t('footer.newsletterBody')}</p>
          </div>
          <NewsletterForm />
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1fr', gap: 36, paddingBottom: 44, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
              <span style={{ fontFamily: serif, fontSize: 19, color: '#fff' }}>Keelstone Trust</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 0 22px', color: 'rgba(255,255,255,.48)' }}>{t('footer.tagline')}</p>
            <div style={{ display: 'flex', gap: 9 }}>
              {[Globe, Cube, ShieldCheck].map((Ic, i) => (
                <a key={i} href="#" style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><Ic size={17} color="rgba(255,255,255,.55)" weight="duotone" /></a>
              ))}
            </div>
          </div>
          {[
            { title: t('footer.colStrategies'), links: [['Growth Strategy', '#strategies'], ['Balanced Strategy', '#strategies'], ['Conservative Strategy', '#strategies'], ['Private Mandate', '#strategies']] },
            { title: t('footer.colCompany'), links: [[t('philosophy.eyebrow'), '#story'], [t('nav.performance'), '#performance'], [t('footer.colGetStarted'), '#plans'], [t('footer.clientLogin'), '/login']] },
            { title: t('footer.colGetStarted'), links: [[t('footer.openAnAccount'), '/signup'], ['Contact Support', 'mailto:contact@keelstone-trust.com'], [t('footer.terms'), '/terms'], [t('footer.privacy'), '/privacy']] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                {col.links.map(([label, href]) =>
                  href.startsWith('/') ? (
                    <Link key={label} to={href} style={{ textDecoration: 'none', color: 'rgba(255,255,255,.48)' }}>{label}</Link>
                  ) : (
                    <a key={label} href={href} style={{ textDecoration: 'none', color: 'rgba(255,255,255,.48)' }}>{label}</a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 0 34px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
          <span>{t('footer.rights')}</span>
          <span>{t('footer.disclaimer')}</span>
        </div>
      </footer>
    </div>
  )
}

const strategyImages = {
  'lumen-s1': '/uploads/hero-trading-chart.jpg',
  'lumen-s2': '/uploads/hero-bitcoin-screen.jpg',
  'lumen-s3': '/uploads/hero-finance-desk.jpg',
}

function StrategyCard({ slot, tag, title, text, yieldVal, risk, bespoke, delay, onOpen }) {
  const { t } = useI18n()
  const [hover, setHover] = useState(false)
  const lift = hover ? { transform: 'translateY(-5px)', boxShadow: '0 28px 60px rgba(0,0,0,.35)' } : {}

  if (bespoke) {
    return (
      <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#0a0612', border: '1px solid rgba(255,255,255,.1)', color: '#fff', transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src="/uploads/hero-portfolio.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .18, display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(10,6,18,.85) 0%, rgba(109,40,217,.08) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 34px', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', padding: '5px 12px', border: '1px solid rgba(255,255,255,.18)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 18, color: 'rgba(255,255,255,.7)' }}>{t('strategies.privateClient')}</div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 12px', color: '#fff' }}>{t('strategies.privateTitle')}</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'rgba(255,255,255,.65)', margin: 0 }}>{t('strategies.privateText')}</p>
          </div>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{t('strategies.speakAdvisor')} <ArrowUpRight size={17} weight="bold" /></div>
        </div>
      </div>
    )
  }

  return (
    <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
      {/* Image with overlay text — no border-radius */}
      <div style={{ position: 'relative', width: '100%', height: 240, overflow: 'hidden' }}>
        <img src={strategyImages[slot] || heroImg} alt={title} style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,6,18,.85) 0%, rgba(10,6,18,.1) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 24px 20px' }}>
          <div style={{ display: 'inline-flex', padding: '4px 10px', border: '1px solid rgba(255,255,255,.2)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)', marginBottom: 10 }}>{tag}</div>
          <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 24, margin: 0, color: '#fff' }}>{title}</h3>
        </div>
      </div>
      <div style={{ padding: '22px 24px 26px' }}>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,.6)', margin: '0 0 18px' }}>{text}</p>
        <div style={{ display: 'flex', gap: 24, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16, alignItems: 'center' }}>
          <div><div style={{ fontFamily: serif, fontSize: 22, color: 'rgba(167,139,250,.9)' }}>{yieldVal}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{t('strategies.annualReturn')}</div></div>
          <div><div style={{ fontFamily: serif, fontSize: 22, color: '#fff' }}>{risk}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{t('strategies.riskProfile')}</div></div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>{t('strategies.viewDetails')} <ArrowUpRight size={14} weight="bold" /></div>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_PLANS = [
  { data: { name: 'Conservative', slug: 'conservative', min_usd: 5000, max_usd: 24999, annual_return_pct: 9, risk: 'Low', strategy: 'Stablecoin yield and conservative crypto exposure.', assets: 'USDC Yield · USDT Reserve · Conservative BTC', perks: ['Professional portfolio management', 'Monthly performance report', 'Investor dashboard access', 'Email advisor support', 'Quarterly rebalancing review'], featured: false, active: true } },
  { data: { name: 'Balanced', slug: 'balanced', min_usd: 25000, max_usd: 99999, annual_return_pct: 15, risk: 'Medium', strategy: 'BTC, ETH and stablecoin yield for balanced growth.', assets: 'Bitcoin 40% · Ethereum 35% · USDC Yield 25%', perks: ['Everything in Conservative', 'Priority advisor support', 'Semi-annual strategy review call', 'Active monthly rebalancing', 'Detailed quarterly reports'], featured: true, active: true } },
  { data: { name: 'Growth', slug: 'growth', min_usd: 100000, max_usd: 499999, annual_return_pct: 22, risk: 'High', strategy: 'Concentrated Bitcoin and Ethereum for maximum long-term appreciation.', assets: 'Bitcoin 70% · Ethereum 30%', perks: ['Everything in Balanced', 'Dedicated portfolio manager', 'Monthly 1-on-1 review call', 'Priority withdrawals', 'Custom strategy adjustments'], featured: false, active: true } },
  { data: { name: 'Private Mandate', slug: 'private', min_usd: 500000, max_usd: 0, annual_return_pct: 0, risk: 'Tailored', strategy: 'Fully bespoke portfolio construction for your specific objectives.', assets: 'Custom allocation', perks: ['Everything in Growth', 'Bespoke portfolio construction', 'In-person advisory meetings', 'Family office services', 'Direct investment desk access'], featured: false, active: true } },
]

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')   // idle | sending | done | error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setMessage('')
    try {
      await subscribe(email, 'landing')
      setState('done')
      setEmail('')
    } catch (err) {
      setState('error')
      setMessage(err?.message || 'Something went wrong. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', border: '1px solid rgba(109,40,217,.4)', background: 'rgba(109,40,217,.12)' }}>
        <span style={{ fontSize: 20, lineHeight: 1, flex: 'none' }}>✓</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>You&apos;re on the list</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.6)' }}>
            The next Investor Letter lands in your inbox at the start of the month.
            You can unsubscribe from any issue.
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <input
          type="email" value={email} required
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
          placeholder="you@example.com" aria-label="Email address"
          style={{ width: '100%', padding: '14px 16px', border: `1px solid ${state === 'error' ? 'rgba(248,113,113,.6)' : 'rgba(255,255,255,.15)'}`, background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 14.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        {state === 'error' && (
          <div style={{ fontSize: 12.5, color: '#fca5a5', marginTop: 7 }}>{message}</div>
        )}
      </div>
      <button
        type="submit" disabled={state === 'sending'}
        style={{ padding: '14px 24px', border: 'none', background: 'linear-gradient(135deg,#6d28d9,#c026d3)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: state === 'sending' ? 'wait' : 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(109,40,217,.4)', opacity: state === 'sending' ? 0.7 : 1, alignSelf: 'flex-start' }}
      >
        {state === 'sending' ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  )
}

function PlanCard({ plan, delay }) {
  const { t } = useI18n()
  const [hover, setHover] = useState(false)
  const featured = !!plan.featured
  const isPrivate = plan.slug === 'private' || plan.annual_return_pct === 0
  const perks = Array.isArray(plan.perks) ? plan.perks : (plan.perks ? JSON.parse(plan.perks) : [])
  const lift = hover ? { transform: 'translateY(-6px)', boxShadow: featured ? '0 32px 70px rgba(109,40,217,.45)' : '0 24px 50px rgba(10,6,18,.22)' } : {}

  return (
    <div data-reveal data-delay={delay} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: featured ? 'linear-gradient(150deg,#6d28d9 0%,#9333ea 50%,#c026d3 100%)' : '#fff',
        border: featured ? '1px solid rgba(255,255,255,.15)' : `1px solid ${C.line}`,
        color: featured ? '#fff' : undefined,
        transition: 'transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s',
        display: 'flex', flexDirection: 'column', ...lift,
      }}>
      {featured && <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,.18)', padding: '4px 9px', backdropFilter: 'blur(4px)' }}>{t('plans.mostPopular')}</div>}

      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginBottom: 10 }}>{t('common.risk', { level: plan.risk })}</div>
        <div style={{ fontFamily: serif, fontSize: 24, color: featured ? '#fff' : C.ink, marginBottom: 16 }}>{plan.name}</div>

        {isPrivate ? (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: serif, fontSize: 38, lineHeight: 1, color: featured ? '#fff' : C.ink }}>{t('common.custom')}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 5 }}>{t('plans.customReturns')}</div>
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(38px,4.5vw,54px)', lineHeight: 1, color: featured ? '#fff' : C.primary }}>{plan.annual_return_pct}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: featured ? 'rgba(255,255,255,.65)' : C.muted }}>{t('plans.targetPa')}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 4 }}>Annual return · {plan.assets}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '14px 0', borderTop: featured ? '1px solid rgba(255,255,255,.18)' : `1px solid ${C.line}`, borderBottom: featured ? '1px solid rgba(255,255,255,.18)' : `1px solid ${C.line}` }}>
          <div>
            <div style={{ color: featured ? 'rgba(255,255,255,.55)' : C.muted, fontWeight: 600 }}>{t('common.minimum')}</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : C.ink }}>${(plan.min_usd || 0).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: featured ? 'rgba(255,255,255,.55)' : C.muted, fontWeight: 600 }}>{t('common.maximum')}</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : C.ink }}>{plan.max_usd ? `$${plan.max_usd.toLocaleString()}` : t('common.noLimit')}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px', flex: 1 }}>
        <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,.52)' : C.muted, marginBottom: 14, lineHeight: 1.55 }}>{plan.strategy}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {perks.map((p) => (
            <div key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: featured ? 'rgba(255,255,255,.85)' : C.body }}>
              <ShieldCheck size={14} weight="fill" color={featured ? 'rgba(255,255,255,.7)' : C.primary} style={{ flex: 'none', marginTop: 2 }} /> {p}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 24px 28px' }}>
        <Link to="/signup" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14.5, fontWeight: 700, padding: '14px 0', background: featured ? '#fff' : C.primary, color: featured ? C.primary : '#fff', transition: 'opacity .2s', borderRadius: RAD, boxShadow: featured ? 'none' : '0 4px 14px rgba(109,40,217,.28)' }}>
          {isPrivate ? t('plans.requestConsultation') : t('common.signUp')} <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7]

function FAQ() {
  const { t } = useI18n()
  const [open, setOpen] = useState(null)
  return (
    <section style={{ padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff', borderTop: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 700, color: C.primary, marginBottom: 14 }}>{t('faq.eyebrow')}</div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(30px,4vw,52px)', lineHeight: 1.08, margin: 0, color: C.ink }}>{t('faq.title')}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQ_KEYS.map((num, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderTop: `1px solid ${C.line}`, ...(i === FAQ_KEYS.length - 1 ? { borderBottom: `1px solid ${C.line}` } : {}) }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: serif, fontSize: 19, color: C.ink, fontWeight: 400 }}>{t(`faq.q${num}`)}</span>
                  <span style={{ flex: 'none', width: 28, height: 28, border: `1px solid ${C.line}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: isOpen ? C.primary : C.muted, fontWeight: 300, transition: 'transform .3s, color .2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                <div style={{ overflow: 'hidden', maxHeight: isOpen ? 300 : 0, transition: 'max-height .4s cubic-bezier(.16,1,.3,1)', }}>
                  <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.body, margin: '0 0 24px', maxWidth: 680 }}>{t(`faq.a${num}`)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TrustMeter({ label, pct, delay }) {
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
    <div ref={ref} data-reveal data-delay={delay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{label}</span>
        <span style={{ fontFamily: serif, fontSize: 22, color: C.primary }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: C.surface, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#6d28d9,#c026d3)', width: fill ? `${pct}%` : '0%', transition: 'width 1.4s cubic-bezier(.16,1,.3,1) .1s' }} />
      </div>
    </div>
  )
}

function Report({ data, shown, onClose }) {
  const { t } = useI18n()
  if (!data) return null
  const reportImages = {
    'lumen-r1': '/uploads/hero-trading-chart.jpg',
    'lumen-r2': '/uploads/hero-bitcoin-screen.jpg',
    'lumen-r3': '/uploads/hero-finance-desk.jpg',
    'lumen-r4': '/uploads/hero-portfolio.jpg',
  }
  const imageBlock = (
    /* Image with text overlay — no border-radius */
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <img src={reportImages[data.slot] || heroImg} alt={data.title} style={{ width: '100%', height: 480, objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '60px 28px 28px', background: 'linear-gradient(to top, rgba(10,6,18,.9) 0%, transparent 100%)' }}>
        <div style={{ fontFamily: serif, fontSize: 16, color: '#fff', opacity: .7 }}>{data.tag}</div>
      </div>
    </div>
  )
  const textBlock = (
    <div>
      <div style={{ display: 'inline-flex', padding: '5px 12px', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.8)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 22 }}>{data.tag}</div>
      <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.5vw,54px)', lineHeight: 1.06, color: '#fff', margin: '0 0 18px' }}>{data.title}</h2>
      <p style={{ fontSize: 16.5, lineHeight: 1.75, color: 'rgba(255,255,255,.68)', margin: '0 0 28px' }}>{data.desc}</p>
      {data.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden', marginBottom: 28 }}>
          {data.stats.map(([v, l], i) => (
            <div key={l} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ fontFamily: serif, fontSize: 26, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {data.bullets.map((b) => (
          <div key={b} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', color: 'rgba(255,255,255,.82)', fontSize: 14.5 }}>
            <ShieldCheck size={16} weight="fill" color="#a78bfa" style={{ flex: 'none', marginTop: 2 }} /> {b}
          </div>
        ))}
      </div>
      <Link to="/signup" onClick={onClose} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: '#fff', padding: '14px 28px', background: C.primary, borderRadius: RAD, boxShadow: '0 6px 22px rgba(109,40,217,.38)' }}>{data.cta} <ArrowRight size={16} weight="bold" /></Link>
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: 'linear-gradient(150deg,#0a0612 0%,#13082a 100%)', opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(.97)', transition: 'opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 60% at 80% 30%, rgba(109,40,217,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,5vw,64px)', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: '#fff' }}>
            <div style={{ width: 28, height: 28, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
            <span style={{ fontFamily: serif, fontSize: 18 }}>Keelstone Trust</span>
            <span style={{ opacity: .4, fontSize: 12, fontWeight: 600 }}>Investment Strategy Report</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
        </div>
        <div data-reportgrid style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center', flex: 1 }}>
          {data.imageLeft ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
        </div>
      </div>
    </div>
  )
}
