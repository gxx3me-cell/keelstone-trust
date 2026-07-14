import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/cocobase'
import ImageSlot from '../components/ImageSlot'
import { useReveal, useCountUp } from '../hooks/useReveal'
import {
  ShieldCheck, TrendUp, Coins, Globe, Lightning, Headset, Lock,
  CreditCard, ArrowRight, ArrowUpRight, List, X, CaretRight,
  Vault, ChartLineUp, Cube,
} from '@phosphor-icons/react'

const heroImg = '/uploads/pasted-1782018213315-0.png'

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

const navItems = [
  ['Philosophy', '#story'], ['Strategies', '#strategies'], ['Plans', '#plans'],
  ['Referrals', '#referrals'], ['Performance', '#performance'],
]

export default function LumenCapital() {
  const rootRef = useRef(null)
  const navRef = useRef(null)
  const [activeReport, setActiveReport] = useState(null)
  const [shown, setShown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plans, setPlans] = useState([])

  useReveal(rootRef)
  useCountUp(rootRef)

  useEffect(() => {
    db.listDocuments('lumen_plans', { sort: 'sort_order', order: 'asc', limit: 10 })
      .then((res) => { const rows = Array.isArray(res) ? res : (res?.data ?? []); if (rows.length) setPlans(rows) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const nav = navRef.current
    const onScroll = () => {
      if (!nav) return
      const sy = window.scrollY || window.pageYOffset
      if (sy > 12) {
        nav.style.boxShadow = '0 1px 0 rgba(17,16,24,.06)'
        nav.style.background = 'rgba(250,249,253,.97)'
      } else {
        nav.style.boxShadow = 'none'
        nav.style.background = 'rgba(250,249,253,.92)'
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

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', overflow: 'hidden', background: C.white, color: C.ink }}>

      {/* NAV */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px clamp(18px,5vw,72px)',
          background: 'rgba(250,249,253,.92)', backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${C.line}`,
          transition: 'box-shadow .3s ease',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: C.primary, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Vault size={17} color="#fff" weight="duotone" />
          </div>
          <span style={{ fontFamily: serif, fontSize: 20, color: C.ink, letterSpacing: '.2px' }}>Lumen</span>
        </Link>
        <div data-navlinks style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 14, fontWeight: 500, color: C.body }}>
          {navItems.map(([label, href]) => (
            <a key={label} href={href} style={{ textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.target.style.color=C.primary} onMouseLeave={(e) => e.target.style.color=C.body}>{label}</a>
          ))}
        </div>
        <div data-navactions style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/login" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 600, color: C.body, padding: '9px 16px' }}>Sign in</Link>
          <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#fff', padding: '10px 20px', background: C.primary, borderRadius: RAD }}>
            Open Account <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
        <button
          type="button" data-navtoggle aria-label="Toggle menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'none', width: 44, height: 44, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: RAD }}
        >
          {menuOpen ? <X size={22} color={C.ink} /> : <List size={22} color={C.ink} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 119, pointerEvents: menuOpen ? 'auto' : 'none' }}>
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(17,16,24,.4)', opacity: menuOpen ? 1 : 0, transition: 'opacity .35s ease', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(86vw,320px)', background: '#fff', borderLeft: `1px solid ${C.line}`, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .45s cubic-bezier(.16,1,.3,1)', display: 'flex', flexDirection: 'column', padding: '22px 22px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Vault size={15} color="#fff" weight="duotone" /></div>
              <span style={{ fontFamily: serif, fontSize: 18, color: C.ink }}>Lumen</span>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 38, height: 38, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: RAD }}><X size={18} color={C.ink} /></button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {navItems.map(([label, href], i) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}
                style={{ textDecoration: 'none', fontFamily: serif, fontSize: 21, color: C.ink, padding: '14px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'none' : 'translateX(14px)', transition: `opacity .4s ease ${0.08 + i * 0.04}s, transform .4s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.04}s` }}>
                {label} <CaretRight size={14} color={C.muted} />
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 14.5, fontWeight: 600, color: C.body, padding: '13px 0', border: `1px solid ${C.line}`, borderRadius: RAD }}>Sign in</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: '#fff', padding: '14px 0', background: C.primary, borderRadius: RAD }}>Open Account</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '92vh', padding: '150px clamp(18px,5vw,72px) 80px', display: 'flex', alignItems: 'center', background: '#faf9fd', overflow: 'hidden' }}>
        {/* Single, restrained glow — far right, very faint */}
        <div style={{ position: 'absolute', top: '5%', right: '-12%', width: 680, height: 680, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,.07) 0%, transparent 68%)', pointerEvents: 'none' }} />

        <div data-herogrid style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 28 }}>
              <ShieldCheck size={13} color={C.primary} weight="fill" /> Professional Digital Asset Management
            </div>
            <h1 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(46px,5.6vw,82px)', lineHeight: 1.03, letterSpacing: '-.5px', margin: '0 0 24px', color: C.ink }}>
              Wealth managed<br />with <em style={{ fontStyle: 'italic', color: C.primary }}>discipline</em><br />and clarity.
            </h1>
            <p data-reveal data-delay="160" style={{ fontSize: 17.5, lineHeight: 1.75, color: C.body, maxWidth: 480, margin: '0 0 36px' }}>
              Professionally managed digital asset portfolios for investors seeking long-term exposure to the digital economy — without the complexity.
            </p>
            <div data-reveal data-delay="240" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}>
              <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, color: '#fff', padding: '15px 28px', background: C.primary, borderRadius: RAD, boxShadow: '0 6px 22px rgba(109,40,217,.32)' }}>
                Open Your Account <ArrowRight size={16} weight="bold" />
              </Link>
              <a href="#strategies" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: C.body, padding: '15px 24px', border: `1px solid ${C.line}`, borderRadius: RAD }}>
                View Strategies
              </a>
            </div>
            <div data-reveal data-delay="320" style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
              {[
                [<>$<span data-count="1.4" data-dec="1">0</span>B</>, 'Assets under management'],
                [<><span data-count="48000">0</span>+</>, 'Investors served'],
                [<><span data-count="38">0</span></>, 'Countries'],
              ].map(([v, l], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
                  {i > 0 && <div style={{ width: 1, height: 36, background: C.line }} />}
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 28, color: C.ink }}>{v}</div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal data-delay="200" style={{ position: 'relative' }}>
            {/* Image: text overlay — no border-radius */}
            <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 24px 64px rgba(109,40,217,.10)' }}>
              <img src={heroImg} alt="Lumen dashboard" style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 24px 24px', background: 'linear-gradient(to top, rgba(10,6,18,.88) 0%, transparent 100%)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Live Portfolio</div>
                <div style={{ fontFamily: serif, fontSize: 24, color: '#fff', marginBottom: 4 }}>$248,750 · +18.6%</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>Growth Strategy · BTC + ETH · All-time return</div>
              </div>
            </div>
            {/* Floating stat card */}
            <div style={{ position: 'absolute', top: -14, right: -14, zIndex: 3, background: '#fff', border: `1px solid ${C.line}`, padding: '14px 20px', boxShadow: '0 12px 36px rgba(109,40,217,.14)', borderRadius: RAD }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 3 }}>Annual return</div>
              <div style={{ fontFamily: serif, fontSize: 26, color: C.primary }}>+22%</div>
              <div style={{ fontSize: 11, color: C.muted }}>Growth Strategy</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ padding: '28px 0', borderBottom: `1px solid ${C.line}`, background: C.surface, overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, margin: '0 0 22px' }}>Trusted by institutional investors &amp; family offices worldwide</p>
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
            <span style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted, fontWeight: 700 }}>Live platform activity</span>
          </div>
          <div data-livestats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
            {[
              [<>$<span data-count="312.4" data-dec="1">0</span>M</>, 'Total capital deployed'],
              [<>$<span data-count="248.9" data-dec="1">0</span>M</>, 'Total returns distributed'],
              [<><span data-count="48217">0</span></>, 'Registered investors'],
              [<><span data-count="2184">0</span></>, 'Days in operation'],
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
            <span style={{ color: C.primary }}>Our Investment Philosophy</span>
            <span style={{ width: 24, height: 1, background: 'linear-gradient(90deg,#c026d3,#6d28d9)', display: 'inline-block' }} />
          </div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.6vw,62px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: '0 0 28px', color: C.ink }}>
            Wealth is built through discipline.<br /><span style={{ fontStyle: 'italic', color: C.primary }}>Not speculation.</span>
          </h2>
          <p data-reveal data-delay="140" style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '0 auto 22px', maxWidth: 720 }}>
            Digital assets have become one of the fastest-growing asset classes in modern finance. But successful investing isn't simply about buying Bitcoin or Ethereum — it requires understanding market cycles, managing risk intelligently, and maintaining a disciplined long-term strategy.
          </p>
          <p data-reveal data-delay="200" style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '0 auto', maxWidth: 720 }}>
            Our experienced investment team continuously monitors market conditions and makes informed adjustments designed to preserve capital while pursuing long-term growth. <strong style={{ color: C.ink }}>You focus on building your wealth. We focus on managing your portfolio.</strong>
          </p>
        </div>
      </section>

      {/* THREE PRINCIPLES */}
      <section style={{ padding: '0 clamp(18px,5vw,72px) clamp(74px,10vh,120px)', background: '#fff' }}>
        <div data-principles style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
          {[
            { num: '01', Icon: ShieldCheck, title: 'Portfolio Management', text: 'Professional allocation, continuous monitoring, and quarterly reviews — all managed on your behalf by our experienced investment team.', grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
            { num: '02', Icon: ChartLineUp, title: 'Risk Management', text: 'Disciplined exposure across growth, balanced, and conservative mandates. Your capital is protected through intelligent diversification.', grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
            { num: '03', Icon: Coins, title: 'Transparent Reporting', text: 'Complete visibility into portfolio performance. Monthly reports, real-time dashboard access, and quarterly reviews — always.', grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
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
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: 'rgba(167,139,250,.9)' }}>Investment Strategies</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.06, letterSpacing: '-.5px', margin: 0, color: '#fff' }}>Three professionally managed strategies. One trusted firm.</h2>
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
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>Investment Tiers</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, margin: '0 0 16px', color: C.ink }}>Select the investment tier that fits your objectives.</h2>
            <p data-reveal data-delay="140" style={{ fontSize: 16.5, lineHeight: 1.65, color: C.body, margin: 0 }}>Every tier provides full portfolio management, quarterly performance reporting, and access to your personalized investor dashboard. Minimum investment $5,000 USD.</p>
          </div>
          <div data-plans-grid style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length || 4, 4)},1fr)`, gap: 16 }}>
            {(plans.length ? plans : FALLBACK_PLANS).map((p, i) => {
              const d = p.data || p
              return <PlanCard key={d.name} plan={d} delay={i * 80 || undefined} />
            })}
          </div>
          <p data-reveal style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, marginTop: 26 }}>Returns represent target annual figures based on strategy performance. Digital assets carry risk; past performance does not guarantee future results. All figures in USD.</p>
        </div>
      </section>

      {/* REFERRALS */}
      <section id="referrals" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: 'linear-gradient(145deg,#0a0612 0%,#130a28 50%,#1a0a2e 100%)', color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(109,40,217,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-appgrid style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 52, alignItems: 'center' }}>
            <div>
              <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 800, marginBottom: 14 }}>Partner Program</div>
              <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(30px,4vw,50px)', lineHeight: 1.1, color: '#fff', margin: '0 0 18px' }}>Earn across three tiers of referrals.</h2>
              <p data-reveal data-delay="140" style={{ fontSize: 16.5, lineHeight: 1.65, color: 'rgba(255,255,255,.65)', margin: '0 0 28px', maxWidth: 450 }}>Introduce investors to Lumen and earn a recurring commission on their investment capital — and on the capital of everyone they bring in, up to three levels deep.</p>
              <div data-reveal data-delay="200" style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                <div><div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}>$<span data-count="6.2" data-dec="1">0</span>M</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Paid to partners</div></div>
                <div style={{ width: 1, background: 'rgba(255,255,255,.14)' }} />
                <div><div style={{ fontFamily: serif, fontSize: 28, color: '#fff' }}><span data-count="3900">0</span>+</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Active partners</div></div>
              </div>
            </div>
            <div data-referral-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.14)', borderRadius: RAD, overflow: 'hidden' }}>
              {[
                { lvl: '1', desc: 'Direct referrals', rate: '2%' },
                { lvl: '2', desc: 'Their referrals', rate: '3%' },
                { lvl: '3', desc: 'Extended network', rate: '5%' },
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
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>Why Lumen</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, margin: 0, color: C.ink }}>Built for trust. Engineered for performance.</h2>
          </div>
          <div data-benefits-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, overflow: 'hidden', marginBottom: 52 }}>
            {[
              { Icon: TrendUp, title: 'Professional Portfolio Management', text: 'Our investment team continuously monitors market conditions and actively manages your allocation — so you never have to.', grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
              { Icon: Globe, title: 'Worldwide Operations', text: 'Serving investors in 38 countries with full multi-currency deposit and withdrawal support across all major rails.', grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
              { Icon: Lightning, title: 'Real-Time Reporting', text: 'Access your personalized investor dashboard at any time. Full transparency into performance, allocation, and activity.', grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
              { Icon: Headset, title: 'Dedicated Advisor Support', text: 'Every client has access to our support team. Growth tier and above includes a dedicated account manager.', grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
              { Icon: Lock, title: 'Institutional-Grade Security', text: 'Multi-signature custody, bank-grade encryption, and enterprise-level DDoS protection on every layer of our infrastructure.', grad: 'linear-gradient(135deg,#c026d3,#e879f9)' },
              { Icon: CreditCard, title: 'Flexible Funding Options', text: 'Fund and withdraw via bank transfer, card, and major digital assets. Fast processing, transparent timelines.', grad: 'linear-gradient(135deg,#7c3aed,#c026d3)' },
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
              { label: 'Registered & compliant firm', pct: 100 },
              { label: 'Client satisfaction rate', pct: 99 },
              { label: 'Portfolio uptime & availability', pct: 100 },
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
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 30% 50%, rgba(109,40,217,.22) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 52px' }}>
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: 'rgba(167,139,250,.9)' }}>Track Record</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,56px)', lineHeight: 1.08, color: '#fff', margin: 0 }}>Performance built on discipline.</h2>
          </div>
          <div data-stats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
            {[
              [<>$<span data-count="1.4" data-dec="1">0</span>B</>, 'Assets under management'],
              [<><span data-count="99.9" data-dec="1">0</span>%</>, 'Portfolio uptime'],
              [<><span data-count="48000">0</span>+</>, 'Investors served'],
              [<><span data-count="38">0</span></>, 'Countries served'],
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
            <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16, color: C.primary }}>How It Works</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: '0 0 24px', color: C.ink }}>Four steps to a professionally managed portfolio.</h2>
            <div data-reveal data-delay="220" style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 440 }}>
              {[
                { step: '01', title: 'Apply & Verify', sub: 'Create your account and complete our secure identity verification process.' },
                { step: '02', title: 'Fund Your Portfolio', sub: 'Transfer your investment capital securely through our funding portal.' },
                { step: '03', title: 'Portfolio Allocation', sub: 'Our team allocates your capital according to your chosen investment strategy.' },
                { step: '04', title: 'Monitor & Grow', sub: 'Access your investor dashboard anytime to monitor performance and review reports.' },
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
            <img src={heroImg} alt="Lumen investor dashboard" style={{ display: 'block', width: '100%', height: 'auto' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '50px 26px 26px', background: 'linear-gradient(to top, rgba(10,6,18,.9) 0%, transparent 100%)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 5 }}>Investor Dashboard</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: '#fff' }}>Full visibility into your portfolio, 24/7.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* FINAL CTA */}
      <section style={{ position: 'relative', padding: 'clamp(84px,12vh,140px) clamp(18px,5vw,72px)', background: C.ink, color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-8%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>Get started</div>
          <h2 data-reveal data-delay="60" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,5vw,64px)', lineHeight: 1.06, margin: '0 0 20px' }}>Begin your journey with Lumen.</h2>
          <p data-reveal data-delay="120" style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', margin: '0 auto 36px', maxWidth: 500 }}>Join investors who trust Lumen to manage their digital asset portfolios with professionalism, transparency, and discipline.</p>
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
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(26px,3.2vw,38px)', lineHeight: 1.1, color: '#fff', margin: '0 0 10px' }}>The Lumen Investor Letter</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.55)', margin: 0, maxWidth: 420 }}>A monthly brief on digital asset strategy, market insights, and portfolio commentary — from the Lumen investment team.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="email" placeholder="you@example.com" style={{ flex: 1, minWidth: 180, padding: '14px 16px', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 14.5, outline: 'none', fontFamily: 'inherit' }} />
            <button type="submit" style={{ padding: '14px 24px', border: 'none', background: 'linear-gradient(135deg,#6d28d9,#c026d3)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(109,40,217,.4)' }}>Subscribe</button>
          </form>
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1fr', gap: 36, paddingBottom: 44, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6d28d9,#c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Vault size={18} color="#fff" weight="duotone" /></div>
              <span style={{ fontFamily: serif, fontSize: 19, color: '#fff' }}>Lumen</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 0 22px', color: 'rgba(255,255,255,.48)' }}>Professional digital asset wealth management for investors who think in generations, not quarters.</p>
            <div style={{ display: 'flex', gap: 9 }}>
              {[Globe, Cube, ShieldCheck].map((Ic, i) => (
                <a key={i} href="#" style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><Ic size={17} color="rgba(255,255,255,.55)" weight="duotone" /></a>
              ))}
            </div>
          </div>
          {[
            { title: 'Strategies', links: [['Growth Strategy', '#strategies'], ['Balanced Strategy', '#strategies'], ['Conservative Strategy', '#strategies'], ['Private Mandate', '#strategies']] },
            { title: 'Company', links: [['Our Philosophy', '#story'], ['Performance', '#performance'], ['Investment Plans', '#plans'], ['Client Login', '/login']] },
            { title: 'Get Started', links: [['Open an Account', '/signup'], ['Speak with an Advisor', '/signup'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']] },
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
          <span>© 2026 Lumen. All rights reserved.</span>
          <span>Digital assets carry risk. Past performance is not indicative of future results. Capital is not guaranteed.</span>
        </div>
      </footer>
    </div>
  )
}

function StrategyCard({ slot, tag, title, text, yieldVal, risk, bespoke, delay, onOpen }) {
  const [hover, setHover] = useState(false)
  const lift = hover ? { transform: 'translateY(-5px)', boxShadow: '0 28px 60px rgba(0,0,0,.35)' } : {}

  if (bespoke) {
    return (
      <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(135deg,rgba(109,40,217,.25),rgba(192,38,211,.15))', border: '1px solid rgba(255,255,255,.1)', color: '#fff', transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
        <div style={{ padding: '40px 34px', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', padding: '5px 12px', border: '1px solid rgba(255,255,255,.18)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 18, color: 'rgba(255,255,255,.7)' }}>PRIVATE CLIENT</div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 30, margin: '0 0 12px', color: '#fff' }}>Private Mandate</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'rgba(255,255,255,.65)', margin: 0 }}>For portfolios above $250,000, we construct a fully bespoke allocation with a dedicated Lumen wealth advisor.</p>
          </div>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: '#fff' }}>Speak with an advisor <ArrowUpRight size={17} weight="bold" /></div>
        </div>
      </div>
    )
  }

  return (
    <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
      {/* Image with overlay text — no border-radius */}
      <div style={{ position: 'relative', width: '100%', height: 240, overflow: 'hidden' }}>
        <ImageSlot id={slot} shape="rect" placeholder="Strategy image" style={{ width: '100%', height: 240, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,6,18,.85) 0%, rgba(10,6,18,.1) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 24px 20px' }}>
          <div style={{ display: 'inline-flex', padding: '4px 10px', border: '1px solid rgba(255,255,255,.2)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)', marginBottom: 10 }}>{tag}</div>
          <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 24, margin: 0, color: '#fff' }}>{title}</h3>
        </div>
      </div>
      <div style={{ padding: '22px 24px 26px' }}>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,.6)', margin: '0 0 18px' }}>{text}</p>
        <div style={{ display: 'flex', gap: 24, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16, alignItems: 'center' }}>
          <div><div style={{ fontFamily: serif, fontSize: 22, color: 'rgba(167,139,250,.9)' }}>{yieldVal}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Annual return</div></div>
          <div><div style={{ fontFamily: serif, fontSize: 22, color: '#fff' }}>{risk}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Risk profile</div></div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>View details <ArrowUpRight size={14} weight="bold" /></div>
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

function PlanCard({ plan, delay }) {
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
      {featured && <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,.18)', padding: '4px 9px', backdropFilter: 'blur(4px)' }}>Most popular</div>}

      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginBottom: 10 }}>{plan.risk} risk</div>
        <div style={{ fontFamily: serif, fontSize: 24, color: featured ? '#fff' : C.ink, marginBottom: 16 }}>{plan.name}</div>

        {isPrivate ? (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: serif, fontSize: 38, lineHeight: 1, color: featured ? '#fff' : C.ink }}>Bespoke</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 5 }}>Custom return targets</div>
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(38px,4.5vw,54px)', lineHeight: 1, color: featured ? '#fff' : C.primary }}>{plan.annual_return_pct}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: featured ? 'rgba(255,255,255,.65)' : C.muted }}>target p.a.</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 4 }}>Annual return · {plan.assets}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '14px 0', borderTop: featured ? '1px solid rgba(255,255,255,.18)' : `1px solid ${C.line}`, borderBottom: featured ? '1px solid rgba(255,255,255,.18)' : `1px solid ${C.line}` }}>
          <div>
            <div style={{ color: featured ? 'rgba(255,255,255,.55)' : C.muted, fontWeight: 600 }}>Minimum</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : C.ink }}>${(plan.min_usd || 0).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: featured ? 'rgba(255,255,255,.55)' : C.muted, fontWeight: 600 }}>Maximum</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2, color: featured ? '#fff' : C.ink }}>{plan.max_usd ? `$${plan.max_usd.toLocaleString()}` : 'No limit'}</div>
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
          {isPrivate ? 'Request consultation' : 'Open account'} <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

const FAQ_ITEMS = [
  { q: 'How does Lumen manage my portfolio?', a: 'Our investment team allocates your capital across our three strategies — Growth, Balanced, or Conservative — depending on the tier you choose. We actively monitor markets, rebalance quarterly, and publish full performance reports each month.' },
  { q: 'What is the minimum investment?', a: 'The minimum investment is $5,000 USD for the Conservative tier. Higher tiers (Balanced from $25,000, Growth from $100,000, and Private Mandate from $500,000) unlock progressively higher return targets and additional advisory services.' },
  { q: 'How and when can I withdraw my funds?', a: 'Withdrawals are processed within 3–5 business days. You submit a withdrawal request through your investor dashboard, and funds are returned via the same channel you deposited. Priority withdrawal processing is available for Growth tier and above.' },
  { q: 'What digital assets does Lumen invest in?', a: 'Lumen focuses on Bitcoin (BTC) and Ethereum (ETH) as the core growth assets, alongside USDC and USDT stablecoin yield positions for our Balanced and Conservative strategies. We do not invest in speculative altcoins.' },
  { q: 'Is my capital safe?', a: 'Client assets are held using institutional multi-signature custody arrangements. We use bank-grade encryption across all systems, and assets are never pooled or commingled across accounts. That said, digital assets carry inherent market risk and capital is not guaranteed.' },
  { q: 'How do I receive my returns?', a: 'Returns accrue to your portfolio balance and are reflected in your investor dashboard in real time. You may choose to reinvest returns or withdraw them to your wallet or bank account at any point.' },
  { q: 'Do I need prior investment experience?', a: 'No. Lumen is designed for investors at all levels of experience. Our team manages the technical complexity of digital asset allocation on your behalf — you simply choose a tier, fund your account, and monitor your growth.' },
]

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section style={{ padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff', borderTop: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div data-reveal style={{ fontSize: 11.5, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 700, color: C.primary, marginBottom: 14 }}>FAQ</div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(30px,4vw,52px)', lineHeight: 1.08, margin: 0, color: C.ink }}>Common questions, answered.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderTop: `1px solid ${C.line}`, ...(i === FAQ_ITEMS.length - 1 ? { borderBottom: `1px solid ${C.line}` } : {}) }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: serif, fontSize: 19, color: C.ink, fontWeight: 400 }}>{item.q}</span>
                  <span style={{ flex: 'none', width: 28, height: 28, border: `1px solid ${C.line}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: isOpen ? C.primary : C.muted, fontWeight: 300, transition: 'transform .3s, color .2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                <div style={{ overflow: 'hidden', maxHeight: isOpen ? 300 : 0, transition: 'max-height .4s cubic-bezier(.16,1,.3,1)', }}>
                  <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.body, margin: '0 0 24px', maxWidth: 680 }}>{item.a}</p>
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
  if (!data) return null
  const imageBlock = (
    /* Image with text overlay — no border-radius */
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <ImageSlot id={data.slot} shape="rect" placeholder="Report image" style={{ width: '100%', height: 480, display: 'block' }} />
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
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6d28d9,#c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Vault size={14} color="#fff" weight="duotone" /></div>
            <span style={{ fontFamily: serif, fontSize: 18 }}>Lumen</span>
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
