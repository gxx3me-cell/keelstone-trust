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
  ink: '#0e0e12',
  body: '#4a4a55',
  muted: '#8b8b97',
  line: '#e7e7ec',
  surface: '#f6f6f8',
  primary: '#7c3aed',
  secondary: '#ec4899',
  white: '#ffffff',
}
const RAD = 8
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
      if (sy > 24) {
        nav.style.background = '#ffffff'
        nav.style.borderBottomColor = C.line
        nav.style.boxShadow = '0 1px 0 rgba(14,14,18,.02)'
      } else {
        nav.style.background = 'rgba(255,255,255,.85)'
        nav.style.borderBottomColor = 'transparent'
        nav.style.boxShadow = 'none'
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
          background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid transparent',
          transition: 'background .35s ease, border-color .35s ease, box-shadow .35s ease',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Vault size={19} color="#fff" weight="duotone" />
          </div>
          <span style={{ fontFamily: serif, fontSize: 20, color: C.ink, letterSpacing: '.2px' }}>Lumen</span>
        </Link>
        <div data-navlinks style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14.5, fontWeight: 600, color: C.body }}>
          {navItems.map(([label, href]) => (
            <a key={label} href={href} style={{ textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div data-navactions style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{ textDecoration: 'none', fontSize: 14.5, fontWeight: 600, color: C.ink, padding: '10px 16px' }}>Client Login</Link>
          <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 700, color: '#fff', padding: '11px 20px', borderRadius: RAD, background: C.ink }}>
            Open Account <ArrowRight size={15} weight="bold" />
          </Link>
        </div>
        <button
          type="button" data-navtoggle aria-label="Toggle menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'none', width: 44, height: 44, borderRadius: RAD, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          {menuOpen ? <X size={22} color={C.ink} /> : <List size={22} color={C.ink} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 119, pointerEvents: menuOpen ? 'auto' : 'none' }}>
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,18,.4)', opacity: menuOpen ? 1 : 0, transition: 'opacity .35s ease' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(86vw,360px)', background: '#fff', borderLeft: `1px solid ${C.line}`, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .45s cubic-bezier(.16,1,.3,1)', display: 'flex', flexDirection: 'column', padding: '22px 22px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Vault size={17} color="#fff" weight="duotone" /></div>
              <span style={{ fontFamily: serif, fontSize: 19, color: C.ink }}>Lumen</span>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 40, height: 40, borderRadius: RAD, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color={C.ink} /></button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {navItems.map(([label, href], i) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}
                style={{ textDecoration: 'none', fontFamily: serif, fontSize: 25, color: C.ink, padding: '15px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'none' : 'translateX(18px)', transition: `opacity .45s ease ${0.1 + i * 0.05}s, transform .45s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.05}s` }}>
                {label} <CaretRight size={16} color={C.muted} />
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, color: C.ink, padding: '14px 0', borderRadius: RAD, border: `1px solid ${C.line}` }}>Client Login</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', padding: '15px 0', borderRadius: RAD, background: C.ink }}>Open Account</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '92vh', padding: '140px clamp(18px,5vw,72px) 70px', display: 'flex', alignItems: 'center', background: C.white, borderBottom: `1px solid ${C.line}` }}>
        <div data-herogrid style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.02fr 1.18fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: RAD, border: `1px solid ${C.line}`, fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', color: C.body, marginBottom: 26 }}>
              <ShieldCheck size={15} color={C.primary} weight="fill" /> Professional Digital Asset Wealth Management
            </div>
            <h1 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(44px,5.6vw,80px)', lineHeight: 1.02, letterSpacing: '-.5px', margin: '0 0 22px', color: C.ink }}>
              Wealth managed with<br /><span style={{ fontStyle: 'italic', color: C.primary }}>discipline and clarity</span>.
            </h1>
            <p data-reveal data-delay="160" style={{ fontSize: 18.5, lineHeight: 1.6, color: C.body, maxWidth: 510, margin: '0 0 34px' }}>
              Lumen offers professionally managed digital asset portfolios for investors seeking long-term exposure to the digital economy — without the complexity of managing it independently.
            </p>
            <div data-reveal data-delay="240" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 44 }}>
              <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15.5, fontWeight: 700, color: '#fff', padding: '15px 26px', borderRadius: RAD, background: C.ink }}>
                Open Your Account <ArrowRight size={17} weight="bold" />
              </Link>
              <a href="#strategies" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 700, color: C.ink, padding: '15px 24px', borderRadius: RAD, border: `1px solid ${C.line}` }}>
                View Strategies
              </a>
            </div>
            <div data-reveal data-delay="320" style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
              {[
                [<>$<span data-count="1.4" data-dec="1">0</span>B</>, 'Assets under management'],
                [<><span data-count="48000">0</span>+</>, 'Investors served'],
                [<><span data-count="38">0</span></>, 'Countries'],
              ].map(([v, l], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
                  {i > 0 && <div style={{ width: 1, height: 38, background: C.line }} />}
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 28, color: C.ink }}>{v}</div>
                    <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal data-delay="200" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', border: `1px solid ${C.line}`, background: C.surface, overflow: 'hidden' }}>
              <img src={heroImg} alt="Lumen dashboard" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ position: 'absolute', top: 22, left: -22, zIndex: 3, background: '#fff', border: `1px solid ${C.line}`, borderRadius: RAD, padding: '14px 18px', boxShadow: '0 14px 40px rgba(14,14,18,.08)' }}>
              <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>Portfolio Value</div>
              <div style={{ fontFamily: serif, fontSize: 25, color: C.ink }}>$248,750</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendUp size={13} weight="bold" /> +18.6% total return</div>
            </div>
            <div style={{ position: 'absolute', bottom: 24, right: -18, zIndex: 3, background: C.ink, borderRadius: RAD, padding: '14px 18px', color: '#fff' }}>
              <div style={{ fontSize: 11.5, opacity: .7, fontWeight: 600 }}>Annual return</div>
              <div style={{ fontFamily: serif, fontSize: 25 }}>+22%</div>
              <div style={{ fontSize: 11.5, opacity: .75 }}>Growth Strategy · BTC + ETH</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ padding: '34px 0', borderBottom: `1px solid ${C.line}`, background: '#fff', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, margin: '0 0 24px' }}>Trusted by institutional investors &amp; family offices</p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 30s linear infinite', gap: 70, alignItems: 'center', opacity: .5 }}>
          {[0, 1].map((rep) => (
            <span key={rep} style={{ display: 'contents' }}>
              <span style={{ fontFamily: serif, fontSize: 24, color: C.ink, whiteSpace: 'nowrap' }}>Lumina Capital</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: '-.5px' }}>VORTEX</span>
              <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: C.ink }}>Meridian&nbsp;Trust</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: C.ink }}>Velocity</span>
              <span style={{ fontFamily: serif, fontSize: 24, color: C.ink }}>Synergy&nbsp;Partners</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: 1 }}>ENIGMA</span>
            </span>
          ))}
        </div>
      </section>

      {/* LIVE STATS */}
      <section style={{ position: 'relative', padding: 'clamp(54px,7vh,82px) clamp(18px,5vw,72px) 0', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div data-reveal style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 12.5, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, fontWeight: 700 }}>Live platform activity</span>
          </div>
          <div data-livestats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${C.line}`, borderRadius: RAD, overflow: 'hidden' }}>
            {[
              [<>$<span data-count="312.4" data-dec="1">0</span>M</>, 'Total capital deployed'],
              [<>$<span data-count="248.9" data-dec="1">0</span>M</>, 'Total returns distributed'],
              [<><span data-count="48217">0</span></>, 'Registered investors'],
              [<><span data-count="2184">0</span></>, 'Days in operation'],
            ].map(([v, l], i) => (
              <div key={i} data-reveal data-delay={i * 80 || undefined} style={{ textAlign: 'center', padding: '30px 16px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(28px,3.4vw,40px)', color: C.ink, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
          <div data-reveal data-delay="120" style={{ marginTop: 22, borderRadius: RAD, border: `1px solid ${C.line}`, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', background: C.ink, color: '#fff', fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <Lightning size={14} weight="fill" color={C.primary} /> Latest payouts
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 36s linear infinite', gap: 38, padding: '12px 0' }}>
                {[0, 1].map((rep) => (
                  <span key={rep} style={{ display: 'flex', gap: 38 }}>
                    {[
                      ['A. Morgan', 'United Kingdom', '$4,820'],
                      ['L. Nakamura', 'Singapore', '$12,400'],
                      ['R. Okafor', 'Nigeria', '$2,310'],
                      ['S. Almeida', 'Portugal', '$28,950'],
                      ['J. Weber', 'Germany', '$7,640'],
                      ['M. Chen', 'United States', '$54,200'],
                      ['K. Haddad', 'UAE', '$19,075'],
                    ].map(([n, c, amt], i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, whiteSpace: 'nowrap', color: C.body }}>
                        <ArrowUpRight size={14} weight="bold" color="#16a34a" />
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
      <section id="story" style={{ position: 'relative', padding: 'clamp(84px,12vh,140px) clamp(18px,5vw,72px)', background: '#fff' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 18 }}>Our Investment Philosophy</div>
          <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.4vw,58px)', lineHeight: 1.1, letterSpacing: '-.5px', margin: '0 0 26px', color: C.ink }}>
            Wealth is built through discipline.<br /><span style={{ fontStyle: 'italic', color: C.primary }}>Not speculation.</span>
          </h2>
          <p data-reveal data-delay="140" style={{ fontSize: 18.5, lineHeight: 1.7, color: C.body, margin: '0 auto 20px', maxWidth: 720 }}>
            Digital assets have become one of the fastest-growing asset classes in modern finance. But successful investing isn't simply about buying Bitcoin or Ethereum — it requires understanding market cycles, managing risk intelligently, and maintaining a disciplined long-term strategy.
          </p>
          <p data-reveal data-delay="200" style={{ fontSize: 18.5, lineHeight: 1.7, color: C.body, margin: '0 auto', maxWidth: 720 }}>
            At Lumen, our experienced investment team continuously monitors market conditions, manages risk, and makes informed adjustments designed to preserve capital while pursuing long-term growth. <strong style={{ color: C.ink }}>You focus on building your wealth. We focus on managing your portfolio.</strong>
          </p>
        </div>
      </section>

      {/* THREE PRINCIPLES */}
      <section style={{ padding: '0 clamp(18px,5vw,72px) clamp(74px,10vh,120px)', background: '#fff' }}>
        <div data-principles style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, borderRadius: RAD, overflow: 'hidden' }}>
          {[
            { num: '01', Icon: ShieldCheck, title: 'Portfolio Management', text: 'Professional allocation, continuous monitoring, and quarterly reviews — all managed on your behalf by our experienced investment team.' },
            { num: '02', Icon: ChartLineUp, title: 'Risk Management', text: 'Disciplined exposure across growth, balanced, and conservative mandates. Your capital is protected through intelligent diversification and active oversight.' },
            { num: '03', Icon: Coins, title: 'Transparent Reporting', text: 'Complete visibility into how your portfolio is performing. Monthly reports, real-time dashboard access, and quarterly investment reviews — always.' },
          ].map((p, i) => (
            <div key={p.num} data-reveal data-delay={i * 120 || undefined} style={{ background: '#fff', padding: '38px 32px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ width: 50, height: 50, borderRadius: RAD, background: C.surface, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p.Icon size={24} color={C.ink} weight="duotone" />
                </div>
                <span style={{ fontFamily: serif, fontSize: 15, color: C.muted }}>{p.num}</span>
              </div>
              <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 26, margin: '0 0 10px', color: C.ink }}>{p.title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.65, color: C.body, margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STRATEGY CARDS */}
      <section id="strategies" style={{ padding: 'clamp(84px,12vh,130px) clamp(18px,5vw,72px)', background: C.surface, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ maxWidth: 680, marginBottom: 50 }}>
            <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 14 }}>Investment Strategies</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.08, letterSpacing: '-.5px', margin: 0, color: C.ink }}>Three professionally managed strategies. One trusted firm.</h2>
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
      <section id="plans" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 48px' }}>
            <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 14 }}>Investment Tiers</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.1, margin: '0 0 14px', color: C.ink }}>Select the investment tier that fits your objectives.</h2>
            <p data-reveal data-delay="140" style={{ fontSize: 16.5, lineHeight: 1.6, color: C.body, margin: 0 }}>Every tier provides full portfolio management, quarterly performance reporting, and access to your personalized investor dashboard. Minimum investment $5,000 USD.</p>
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
      <section id="referrals" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: C.ink, color: '#fff' }}>
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

      {/* WHY CRESTMONT */}
      <section style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 14 }}>Why Lumen</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.1, margin: 0, color: C.ink }}>Built for trust. Engineered for performance.</h2>
          </div>
          <div data-benefits-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: `1px solid ${C.line}`, borderRadius: RAD, overflow: 'hidden', marginBottom: 52 }}>
            {[
              { Icon: TrendUp, title: 'Professional Portfolio Management', text: 'Our investment team continuously monitors market conditions and actively manages your allocation — so you never have to.' },
              { Icon: Globe, title: 'Worldwide Operations', text: 'Serving investors in 38 countries with full multi-currency deposit and withdrawal support across all major rails.' },
              { Icon: Lightning, title: 'Real-Time Performance Reporting', text: 'Access your personalized investor dashboard at any time. Full transparency into performance, allocation, and activity.' },
              { Icon: Headset, title: 'Dedicated Advisor Support', text: 'Every client has access to our support team. Growth tier and above includes a dedicated account manager.' },
              { Icon: Lock, title: 'Institutional-Grade Security', text: 'Multi-signature custody, bank-grade encryption, and enterprise-level DDoS protection on every layer of our infrastructure.' },
              { Icon: CreditCard, title: 'Flexible Funding Options', text: 'Fund and withdraw via bank transfer, card, and major digital assets. Fast processing, transparent timelines.' },
            ].map((b, i) => (
              <div key={b.title} data-reveal data-delay={(i % 3) * 80 || undefined} style={{ padding: '30px 28px', borderLeft: i % 3 !== 0 ? `1px solid ${C.line}` : 'none', borderTop: i >= 3 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: RAD, background: C.surface, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <b.Icon size={23} color={C.ink} weight="duotone" />
                </div>
                <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 22, margin: '0 0 8px', color: C.ink }}>{b.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: C.body, margin: 0 }}>{b.text}</p>
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
      <section id="performance" style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: C.surface, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
            <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 14 }}>Track Record</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.1, color: C.ink, margin: 0 }}>Performance built on discipline.</h2>
          </div>
          <div data-stats style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${C.line}`, borderRadius: RAD, overflow: 'hidden', background: '#fff' }}>
            {[
              [<>$<span data-count="1.4" data-dec="1">0</span>B</>, 'Assets under management'],
              [<><span data-count="99.9" data-dec="1">0</span>%</>, 'Portfolio uptime'],
              [<><span data-count="48000">0</span>+</>, 'Investors served'],
              [<><span data-count="38">0</span></>, 'Countries served'],
            ].map(([v, l], i) => (
              <div key={i} data-reveal data-delay={i * 100 || undefined} style={{ textAlign: 'center', padding: '40px 20px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,56px)', color: C.ink }}>{v}</div>
                <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600, marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', padding: 'clamp(78px,10vh,124px) clamp(18px,5vw,72px)', background: '#fff' }}>
        <div data-appgrid style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div data-reveal style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 14 }}>How It Works</div>
            <h2 data-reveal data-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.2vw,54px)', lineHeight: 1.1, letterSpacing: '-.5px', margin: '0 0 20px', color: C.ink }}>Four steps to a professionally managed portfolio.</h2>
            <div data-reveal data-delay="220" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
              {[
                { step: '01', title: 'Apply & Verify', sub: 'Create your account and complete our secure identity verification process.' },
                { step: '02', title: 'Fund Your Portfolio', sub: 'Transfer your investment capital securely through our funding portal.' },
                { step: '03', title: 'Portfolio Allocation', sub: 'Our team allocates your capital according to your chosen investment strategy.' },
                { step: '04', title: 'Monitor & Grow', sub: 'Access your investor dashboard anytime to monitor performance and review reports.' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', width: 38, height: 38, borderRadius: RAD, background: i === 0 ? C.ink : C.surface, border: `1px solid ${i === 0 ? C.ink : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 14, color: i === 0 ? '#fff' : C.ink }}>{f.step}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15.5, color: C.ink }}>{f.title}</div><div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>{f.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal data-delay="160" style={{ position: 'relative', border: `1px solid ${C.line}`, background: C.surface, overflow: 'hidden' }}>
            <img src={heroImg} alt="Lumen investor dashboard" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', padding: 'clamp(84px,12vh,140px) clamp(18px,5vw,72px)', background: C.ink, color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h2 data-reveal style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1.06, margin: '0 0 20px' }}>Begin your journey with Lumen.</h2>
          <p data-reveal data-delay="100" style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', margin: '0 auto 34px', maxWidth: 540 }}>Join thousands of investors who trust Lumen to manage their digital asset portfolios with professionalism, transparency, and discipline.</p>
          <div data-reveal data-delay="180" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15.5, fontWeight: 700, color: C.ink, padding: '16px 30px', borderRadius: RAD, background: '#fff' }}>Open Your Account <ArrowRight size={17} weight="bold" /></Link>
            <Link to="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: 15.5, fontWeight: 700, color: '#fff', padding: '16px 28px', borderRadius: RAD, border: '1px solid rgba(255,255,255,.3)' }}>Client Login</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', background: '#fff', color: C.body, padding: 'clamp(56px,8vh,88px) clamp(18px,5vw,72px) 0', borderTop: `1px solid ${C.line}` }}>
        <div data-reveal style={{ maxWidth: 1240, margin: '0 auto 56px', border: `1px solid ${C.line}`, borderRadius: RAD, padding: 'clamp(28px,5vw,48px)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 36, alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(26px,3.2vw,38px)', lineHeight: 1.12, color: C.ink, margin: '0 0 10px' }}>The Lumen Investor Letter</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: C.body, margin: 0, maxWidth: 420 }}>A monthly brief on digital asset strategy, market insights, and portfolio commentary — written by the Lumen investment team.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="email" placeholder="you@example.com" style={{ flex: 1, minWidth: 180, padding: '14px 16px', borderRadius: RAD, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 14.5, outline: 'none' }} />
            <button type="submit" style={{ padding: '14px 24px', borderRadius: RAD, border: 'none', background: C.ink, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
          </form>
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1fr', gap: 36, paddingBottom: 44, borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Vault size={18} color="#fff" weight="duotone" /></div>
              <span style={{ fontFamily: serif, fontSize: 19, color: C.ink }}>Lumen</span>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, maxWidth: 300, margin: '0 0 22px', color: C.body }}>Professional digital asset wealth management for investors who think in generations, not quarters.</p>
            <div style={{ display: 'flex', gap: 9 }}>
              {[Globe, Cube, ShieldCheck].map((Ic, i) => (
                <a key={i} href="#" style={{ width: 38, height: 38, borderRadius: RAD, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><Ic size={17} color={C.ink} weight="duotone" /></a>
              ))}
            </div>
          </div>
          {[
            { title: 'Strategies', links: [['Growth Strategy', '#strategies'], ['Balanced Strategy', '#strategies'], ['Conservative Strategy', '#strategies'], ['Private Mandate', '#strategies']] },
            { title: 'Company', links: [['Our Philosophy', '#story'], ['Performance', '#performance'], ['Investment Plans', '#plans'], ['Client Login', '/login']] },
            { title: 'Get Started', links: [['Open an Account', '/signup'], ['Speak with an Advisor', '/signup'], ['Help & Support', '#']] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 13.5, marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                {col.links.map(([label, href]) =>
                  href.startsWith('/') ? (
                    <Link key={label} to={href} style={{ textDecoration: 'none', color: C.body }}>{label}</Link>
                  ) : (
                    <a key={label} href={href} style={{ textDecoration: 'none', color: C.body }}>{label}</a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 0 34px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12.5, color: C.muted }}>
          <span>© 2026 Lumen. All rights reserved.</span>
          <span>Digital assets carry risk. Past performance is not indicative of future results. Capital is not guaranteed.</span>
        </div>
      </footer>
    </div>
  )
}

function StrategyCard({ slot, tag, title, text, yieldVal, risk, bespoke, delay, onOpen }) {
  const [hover, setHover] = useState(false)
  const lift = hover ? { transform: 'translateY(-4px)', boxShadow: '0 24px 50px rgba(14,14,18,.1)' } : {}

  if (bespoke) {
    return (
      <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', borderRadius: RAD, overflow: 'hidden', cursor: 'pointer', background: C.ink, color: '#fff', transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
        <div style={{ padding: '38px 32px', minHeight: 230, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: RAD, border: '1px solid rgba(255,255,255,.2)', fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', marginBottom: 16 }}>PRIVATE CLIENT</div>
            <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: '0 0 10px' }}>Private Mandate</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', margin: 0 }}>For portfolios above $250,000, we construct a fully bespoke allocation with a dedicated Lumen wealth advisor.</p>
          </div>
          <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700 }}>Learn more <ArrowUpRight size={17} weight="bold" color={C.primary} /></div>
        </div>
      </div>
    )
  }

  return (
    <div data-reveal data-delay={delay} onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', borderRadius: RAD, overflow: 'hidden', cursor: 'pointer', background: '#fff', border: `1px solid ${C.line}`, transition: 'transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s ease', ...lift }}>
      <div style={{ width: '100%', height: 220, borderBottom: `1px solid ${C.line}` }}>
        <ImageSlot id={slot} shape="rect" placeholder="Strategy image" style={{ width: '100%', height: 220 }} />
      </div>
      <div style={{ padding: '28px 28px 30px' }}>
        <div style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: RAD, border: `1px solid ${C.line}`, color: C.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', marginBottom: 14 }}>{tag}</div>
        <h3 style={{ fontFamily: serif, fontWeight: 400, fontSize: 26, margin: '0 0 8px', color: C.ink }}>{title}</h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: C.body, margin: '0 0 18px' }}>{text}</p>
        <div style={{ display: 'flex', gap: 26, borderTop: `1px solid ${C.line}`, paddingTop: 16, alignItems: 'center' }}>
          <div><div style={{ fontFamily: serif, fontSize: 23, color: C.primary }}>{yieldVal}</div><div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>Annual return</div></div>
          <div><div style={{ fontFamily: serif, fontSize: 23, color: C.ink }}>{risk}</div><div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>Risk profile</div></div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: C.ink }}>View details <ArrowUpRight size={15} weight="bold" /></div>
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
  const lift = hover ? { transform: 'translateY(-5px)', boxShadow: '0 30px 60px rgba(14,14,18,.18)' } : {}

  return (
    <div data-reveal data-delay={delay} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', borderRadius: RAD, overflow: 'hidden', background: featured ? C.ink : '#fff', border: featured ? `1px solid ${C.ink}` : `1px solid ${C.line}`, color: featured ? '#fff' : undefined, transition: 'transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s', display: 'flex', flexDirection: 'column', ...lift }}>
      {featured && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#7c3aed,#ec4899)' }} />}
      {featured && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.primary, background: 'rgba(124,58,237,.12)', padding: '3px 8px', borderRadius: 999 }}>Most popular</div>}

      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: featured ? 'rgba(255,255,255,.5)' : C.muted, marginBottom: 10 }}>{plan.risk} risk</div>
        <div style={{ fontFamily: serif, fontSize: 24, color: featured ? '#fff' : C.ink, marginBottom: 14 }}>{plan.name}</div>

        {isPrivate ? (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: serif, fontSize: 36, lineHeight: 1, color: featured ? '#fff' : C.ink }}>Bespoke</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 4 }}>Custom return targets</div>
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: serif, fontSize: 'clamp(38px,4.5vw,52px)', lineHeight: 1, color: featured ? '#fff' : C.primary }}>{plan.annual_return_pct}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: featured ? 'rgba(255,255,255,.6)' : C.muted }}>target p.a.</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: featured ? 'rgba(255,255,255,.6)' : C.muted, marginTop: 3 }}>Annual return · {plan.assets}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '14px 0', borderTop: featured ? '1px solid rgba(255,255,255,.15)' : `1px solid ${C.line}`, borderBottom: featured ? '1px solid rgba(255,255,255,.15)' : `1px solid ${C.line}` }}>
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
        <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,.5)' : C.muted, marginBottom: 12, lineHeight: 1.5 }}>{plan.strategy}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {perks.map((p) => (
            <div key={p} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: featured ? 'rgba(255,255,255,.82)' : C.body }}>
              <ShieldCheck size={15} weight="fill" color={featured ? C.primary : C.ink} style={{ flex: 'none', marginTop: 2 }} /> {p}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '22px 24px 26px' }}>
        <Link to="/signup" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14.5, fontWeight: 700, padding: '13px 0', borderRadius: RAD, background: featured ? C.primary : C.ink, color: '#fff', transition: 'opacity .2s' }}>
          {isPrivate ? 'Request consultation' : 'Open account'} <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{label}</span>
        <span style={{ fontFamily: serif, fontSize: 21, color: C.primary }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: C.surface, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: C.ink, width: fill ? `${pct}%` : '0%', transition: 'width 1.3s cubic-bezier(.16,1,.3,1) .1s' }} />
      </div>
    </div>
  )
}

function Report({ data, shown, onClose }) {
  if (!data) return null
  const imageBlock = (
    <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.14)' }}>
      <ImageSlot id={data.slot} shape="rect" placeholder="Report image" style={{ width: '100%', height: 460 }} />
    </div>
  )
  const textBlock = (
    <div>
      <div style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: RAD, border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', marginBottom: 20 }}>{data.tag}</div>
      <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(34px,4.5vw,56px)', lineHeight: 1.05, color: '#fff', margin: '0 0 18px' }}>{data.title}</h2>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.72)', margin: '0 0 28px' }}>{data.desc}</p>
      {data.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid rgba(255,255,255,.14)', borderRadius: RAD, overflow: 'hidden', marginBottom: 28 }}>
          {data.stats.map(([v, l], i) => (
            <div key={l} style={{ padding: 18, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.14)' : 'none' }}>
              <div style={{ fontFamily: serif, fontSize: 26, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 30 }}>
        {data.bullets.map((b) => (
          <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'rgba(255,255,255,.85)', fontSize: 14.5 }}><ShieldCheck size={17} weight="fill" color={C.primary} /> {b}</div>
        ))}
      </div>
      <Link to="/signup" onClick={onClose} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 15.5, fontWeight: 700, color: C.ink, padding: '15px 28px', borderRadius: RAD, background: '#fff' }}>{data.cta} <ArrowRight size={16} weight="bold" /></Link>
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: C.ink, opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(.96)', transition: 'opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(24px,5vw,64px)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#fff' }}><span style={{ fontFamily: serif, fontSize: 19 }}>Lumen</span><span style={{ opacity: .5, fontSize: 12.5 }}>Investment Strategy Report</span></div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 44, height: 44, borderRadius: RAD, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
        </div>
        <div data-reportgrid style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, alignItems: 'center', flex: 1 }}>
          {data.imageLeft ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
        </div>
      </div>
    </div>
  )
}
