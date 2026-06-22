import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../dashboard/dashboard.css'
import { holdings, txns, txIcon, chg } from '../dashboard/data'
import {
  chartData, perfData, drawArea, drawDonut, drawBars, drawSpark, animate,
} from '../dashboard/charts'

const serif = "'DM Serif Display',serif"

const icons = {
  overview: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  holdings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8.5" cy="8.5" r="5" /><circle cx="15.5" cy="15.5" r="5" /></svg>,
  strategies: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>,
  transactions: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v13M7 4l-3 3M7 4l3 3" /><path d="M17 20V7M17 20l3-3M17 20l-3-3" /></svg>,
  performance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 6" /></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /><circle cx="9" cy="8" r="2.4" fill="var(--sidebar)" /><circle cx="15" cy="16" r="2.4" fill="var(--sidebar)" /></svg>,
}

const navItems = [
  ['overview', 'Overview'], ['holdings', 'Holdings'], ['strategies', 'Strategies'],
  ['transactions', 'Transactions'], ['performance', 'Performance'], ['settings', 'Settings'],
]
const bottomNav = [
  ['overview', 'Home'], ['holdings', 'Assets'], ['strategies', 'Plans'],
  ['performance', 'Stats'], ['settings', 'More'],
]

export default function Dashboard() {
  const rootRef = useRef(null)
  const areaRef = useRef(null)
  const donutRef = useRef(null)
  const perfRef = useRef(null)
  const barsRef = useRef(null)

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lumen-theme') || 'light' } catch { return 'light' }
  })
  const [screen, setScreen] = useState(() => {
    try { return localStorage.getItem('lumen-screen') || 'overview' } catch { return 'overview' }
  })
  const [modal, setModal] = useState(null)
  const [curTf, setCurTf] = useState('1M')
  const [curPerf, setCurPerf] = useState('1Y')
  const [hfilter, setHfilter] = useState('all')
  const [txfilter, setTxfilter] = useState('all')
  const [depositAmt, setDepositAmt] = useState('25,000')
  const [switches, setSwitches] = useState({ '2fa': true, bio: true, email: false })

  const title = navItems.find(([k]) => k === screen)?.[1] || ''

  useEffect(() => { try { localStorage.setItem('lumen-theme', theme) } catch {} }, [theme])
  useEffect(() => { try { localStorage.setItem('lumen-screen', screen) } catch {} }, [screen])

  // redraw charts when relevant inputs change
  useEffect(() => {
    const rootEl = rootRef.current
    if (!rootEl) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (screen === 'overview') {
        animate((p) => drawArea(areaRef.current, chartData[curTf], p, rootEl), 900)
        animate((p) => drawDonut(donutRef.current, p), 900)
      }
      if (screen === 'performance') {
        animate((p) => drawArea(perfRef.current, perfData[curPerf], p, rootEl), 900)
        animate((p) => drawBars(barsRef.current, p, rootEl), 900)
      }
    }))
    return () => cancelAnimationFrame(id)
  }, [screen, theme])

  useEffect(() => {
    const rootEl = rootRef.current
    if (rootEl && screen === 'overview') animate((p) => drawArea(areaRef.current, chartData[curTf], p, rootEl), 700)
  }, [curTf])

  useEffect(() => {
    const rootEl = rootRef.current
    if (rootEl && screen === 'performance') animate((p) => drawArea(perfRef.current, perfData[curPerf], p, rootEl), 700)
  }, [curPerf])

  // redraw sparklines when holdings list is shown/filtered/themed
  useEffect(() => {
    rootRef.current?.querySelectorAll('[data-spark]').forEach((cv) => {
      drawSpark(cv, JSON.parse(cv.getAttribute('data-spark')), cv.getAttribute('data-color'))
    })
  }, [screen, hfilter, theme])

  // resize handler
  useEffect(() => {
    const onResize = () => {
      const rootEl = rootRef.current
      if (!rootEl) return
      drawArea(areaRef.current, chartData[curTf], 1, rootEl)
      drawDonut(donutRef.current, 1)
      drawArea(perfRef.current, perfData[curPerf], 1, rootEl)
      drawBars(barsRef.current, 1, rootEl)
      rootEl.querySelectorAll('[data-spark]').forEach((cv) => drawSpark(cv, JSON.parse(cv.getAttribute('data-spark')), cv.getAttribute('data-color')))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [curTf, curPerf])

  // modal escape + body scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  const goScreen = (name) => { setScreen(name); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const filteredHoldings = holdings.filter((h) => (hfilter === 'all' ? true : hfilter === 'gainers' ? h.chg > 0.5 : h.staked))
  const filteredTx = txns.filter((t) => (txfilter === 'all' ? true : t.type === txfilter))

  return (
    <div ref={rootRef} data-root data-theme={theme} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', transition: 'background .4s ease,color .4s ease' }}>

      {/* SIDEBAR */}
      <aside data-sidebar style={{ width: 262, flex: 'none', position: 'fixed', top: 0, left: 0, height: '100vh', background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '26px 18px', zIndex: 50, transition: 'background .4s,border-color .4s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 28px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(124,58,237,.36)' }}>
            <div style={{ width: 13, height: 13, border: '2.5px solid #fff', borderRadius: 4, transform: 'rotate(45deg)' }} />
          </div>
          <span style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)' }}>Lumen</span>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, padding: '0 12px 10px' }}>Menu</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(([key, label]) => {
            const active = screen === key
            return (
              <button key={key} type="button" onClick={() => goScreen(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 13px', borderRadius: 13, border: 'none', background: active ? 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(236,72,153,.12))' : 'transparent', color: active ? '#7c3aed' : 'var(--text-2)', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'background .2s,color .2s', fontFamily: 'inherit' }}>
                {icons[key]} {label}
              </button>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'linear-gradient(150deg,#7c3aed,#ec4899)', borderRadius: 18, padding: 18, color: '#fff' }}>
            <div style={{ fontFamily: serif, fontSize: 18, marginBottom: 4 }}>Grow your reserve</div>
            <div style={{ fontSize: 12.5, opacity: .88, lineHeight: 1.5, marginBottom: 14 }}>Add funds to unlock higher-yield strategies.</div>
            <button type="button" onClick={() => setModal('deposit')} style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: '#fff', color: '#7c3aed', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Deposit funds</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flex: 'none' }}>JC</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Jordan Cole</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Private client</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main data-main style={{ flex: 1, marginLeft: 262, padding: '0 clamp(18px,3vw,38px) 48px', minWidth: 0 }}>
        {/* TOPBAR */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0', background: 'var(--bg)', transition: 'background .4s' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 data-pagetitle style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(24px,3vw,32px)', margin: 0, color: 'var(--text)' }}>{title}</h1>
          </div>
          <div data-topbar-search style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', width: 240 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
            <input placeholder="Search assets…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <button type="button" data-hidemobile onClick={() => setModal('withdraw')} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Withdraw</button>
          <button type="button" onClick={() => setModal('deposit')} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 24px rgba(124,58,237,.32)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Deposit</button>
          <button type="button" onClick={toggleTheme} style={{ width: 44, height: 44, flex: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
        </div>

        {/* OVERVIEW */}
        {screen === 'overview' && (
          <section data-pane="overview">
            <div data-overviewgrid style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Total reserve value</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                      <div style={{ fontFamily: serif, fontSize: 'clamp(34px,4vw,46px)', color: 'var(--text)', lineHeight: 1 }}>$527,439</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(34,197,94,.12)', color: '#16a34a', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>▲ 18.4%</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>+$82,140 all-time · +$12,840 yield earned</div>
                  </div>
                  <TabGroup tabs={['1W', '1M', '3M', '1Y', 'ALL']} active={curTf} onChange={setCurTf} />
                </div>
                <canvas ref={areaRef} style={{ width: '100%', height: 230, marginTop: 10 }} />
              </div>

              <div style={card(24)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Allocation</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>Across 5 assets</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <canvas ref={donutRef} style={{ width: 180, height: 180 }} />
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Assets</div>
                    <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)' }}>5</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
                  {[['DAS-Prime', '45.8%', '#7c3aed'], ['DAS-Yield', '24.3%', '#6366f1'], ['DAS-Growth', '12.0%', '#ec4899'], ['DAS-Infra', '10.4%', '#14b8a6'], ['DAS-Reserve', '7.4%', '#f59e0b']].map(([n, p, c]) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: c }} /><span style={{ color: 'var(--text-2)', flex: 1 }}>{n}</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{p}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div data-grid4 style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'YTD return', val: '+18.4%', sub: '▲ Outperforming', subColor: '#16a34a' },
                { label: 'Annual yield', val: '7.2%', sub: 'Staking + infra', subColor: 'var(--text-3)' },
                { label: 'Yield earned', val: '$12,840', sub: '▲ +$640 this mo', subColor: '#16a34a' },
                { label: 'Risk score', val: 'Low–Med', sub: 'Balanced mandate', subColor: 'var(--text-3)' },
              ].map((s) => (
                <div key={s.label} style={card(20, 20)}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>{s.label}</div>
                  <div style={{ fontFamily: serif, fontSize: 28, color: 'var(--text)' }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: s.subColor, fontWeight: 700, marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div data-grid2 style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20 }}>
              <div style={card(24)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Top holdings</div>
                  <button type="button" onClick={() => goScreen('holdings')} style={linkBtn()}>View all →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {holdings.slice(0, 5).map((h) => {
                    const c = chg(h.chg)
                    return (
                      <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 6px', borderRadius: 12 }}>
                        <div style={iconChip(h.color, 38)}>{h.sym.slice(0, 3)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.amt}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.val}</div><div style={{ fontSize: 12, color: c.col, fontWeight: 700 }}>{c.text}</div></div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={card(24)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Recent activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {txns.slice(0, 5).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${txIcon[t.type]}1e`, color: txIcon[t.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 15 }}>{t.sign > 0 ? '↓' : '↑'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t.when}</div></div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.sign > 0 ? '#16a34a' : 'var(--text)' }}>{t.amt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* HOLDINGS */}
        {screen === 'holdings' && (
          <section data-pane="holdings">
            <div style={card(24)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>All holdings</div>
                <TabGroup tabs={[['all', 'All'], ['gainers', 'Gainers'], ['staked', 'Staked']]} active={hfilter} onChange={setHfilter} />
              </div>
              <div data-hidemobile style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.2fr 1fr 1.3fr', gap: 14, padding: '0 6px 12px', borderBottom: '1px solid var(--border)', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                <div>Asset</div><div>Holdings</div><div>Price</div><div>24h</div><div style={{ textAlign: 'right' }}>Value</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredHoldings.map((h) => {
                  const c = chg(h.chg)
                  return (
                    <div key={h.name} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.2fr 1fr 1.3fr', gap: 14, alignItems: 'center', padding: '15px 6px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={iconChip(h.color, 40)}>{h.sym.slice(0, 3)}</div>
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.sym}{h.staked ? ' · Staked' : ''}</div></div>
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 600 }}>{h.amt}</div>
                      <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{h.price}</div>
                      <div style={{ fontSize: 13, color: c.col, fontWeight: 700 }}>{c.text}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <canvas data-hidemobile data-spark={JSON.stringify(h.spark)} data-color={h.color} style={{ width: 60, height: 30 }} />
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.val}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{h.pct}</div></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* STRATEGIES */}
        {screen === 'strategies' && (
          <section data-pane="strategies">
            <div data-grid3 style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 20 }}>
              {[
                { name: 'Preservation', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', pctColor: '#7c3aed', pctBg: 'rgba(124,58,237,.1)', pct: '40%', desc: 'Capital protection through deep-liquidity assets.', alloc: '$210,976', yld: '4.1%', icon: <div style={{ width: 18, height: 18, border: '3px solid #fff', borderRadius: 5 }} /> },
                { name: 'Growth', grad: 'linear-gradient(135deg,#ec4899,#f97316)', pctColor: '#ec4899', pctBg: 'rgba(236,72,153,.1)', pct: '35%', desc: 'Long-term appreciation across market cycles.', alloc: '$184,604', yld: '11.6%', icon: <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '15px solid #fff' }} /> },
                { name: 'Income', grad: 'linear-gradient(135deg,#f97316,#fbbf24)', pctColor: '#f97316', pctBg: 'rgba(249,115,22,.12)', pct: '25%', desc: 'Passive yield via staking & infrastructure.', alloc: '$131,859', yld: '7.2%', icon: <div style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid #fff' }} /> },
              ].map((s) => <StrategyCard key={s.name} {...s} />)}
            </div>
            <div style={card(24)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Strategy mix</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 18 }}>Your reserve is balanced across three mandates. Tap a strategy above for the full report.</div>
              <div style={{ display: 'flex', height: 18, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '40%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                <div style={{ width: '35%', background: 'linear-gradient(90deg,#ec4899,#f97316)' }} />
                <div style={{ width: '25%', background: 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}><span>Preservation 40%</span><span>Growth 35%</span><span>Income 25%</span></div>
            </div>
          </section>
        )}

        {/* TRANSACTIONS */}
        {screen === 'transactions' && (
          <section data-pane="transactions">
            <div style={card(24)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Transaction history</div>
                <TabGroup tabs={[['all', 'All'], ['deposit', 'Deposits'], ['buy', 'Buys'], ['yield', 'Yield']]} active={txfilter} onChange={setTxfilter} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTx.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 6px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${txIcon[t.type]}1e`, color: txIcon[t.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 17 }}>{t.sign > 0 ? '↓' : '↑'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{t.label}</div><div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{t.sub}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14.5, fontWeight: 700, color: t.sign > 0 ? '#16a34a' : 'var(--text)' }}>{t.amt}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.when}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PERFORMANCE */}
        {screen === 'performance' && (
          <section data-pane="performance">
            <div style={{ ...card(26), marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>Cumulative return</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}><div style={{ fontFamily: serif, fontSize: 40, color: 'var(--text)', lineHeight: 1 }}>+42.1%</div><div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>past 12 months</div></div>
                </div>
                <TabGroup tabs={['6M', '1Y', 'ALL']} active={curPerf} onChange={setCurPerf} />
              </div>
              <canvas ref={perfRef} style={{ width: '100%', height: 260, marginTop: 10 }} />
            </div>
            <div data-grid2 style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
              <div style={card(24)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Monthly returns</div>
                <canvas ref={barsRef} style={{ width: '100%', height: 200 }} />
              </div>
              <div style={{ ...card(24), display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Key metrics</div>
                {[['Best month', '+6.2%', '#16a34a'], ['Worst month', '−2.1%', '#ef4444'], ['Sharpe ratio', '1.84', 'var(--text)'], ['Max drawdown', '−8.4%', 'var(--text)'], ['Volatility', 'Moderate', 'var(--text)']].map(([k, v, c]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{k}</span><span style={{ fontWeight: 700, color: c }}>{v}</span></div>
                ))}
                <div style={{ marginTop: 'auto', background: 'var(--surface-2)', borderRadius: 14, padding: 14, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Returns shown net of fees. Past performance is not indicative of future results.</div>
              </div>
            </div>
          </section>
        )}

        {/* SETTINGS */}
        {screen === 'settings' && (
          <section data-pane="settings">
            <div data-grid2 style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={card(26)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>JC</div>
                  <div><div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Jordan Cole</div><div style={{ fontSize: 13, color: 'var(--text-3)' }}>jordan.cole@example.com</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[['Full name', 'Jordan Cole'], ['Tier', 'Private client · $1M+ mandate']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>{k}</div><div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px', fontSize: 14, color: 'var(--text)' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={card(26)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Security &amp; preferences</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { key: '2fa', title: 'Two-factor authentication', sub: 'Extra layer of account security' },
                    { key: 'bio', title: 'Biometric login', sub: 'Face ID / fingerprint on mobile' },
                    { key: 'email', title: 'Email reports', sub: 'Monthly Reserve Letter' },
                  ].map((row, i) => (
                    <SettingRow key={row.key} {...row} on={switches[row.key]} onToggle={() => setSwitches((s) => ({ ...s, [row.key]: !s[row.key] }))} border={i < 3} />
                  ))}
                  <SettingRow title="Dark appearance" sub="Toggle light / dark theme" on={theme === 'dark'} onToggle={toggleTheme} border={false} />
                </div>
                <Link to="/login" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: 22, padding: 13, borderRadius: 12, border: '1px solid var(--border)', color: '#ef4444', fontSize: 14, fontWeight: 700 }}>Sign out</Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav data-bottomnav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'var(--sidebar)', borderTop: '1px solid var(--border)', padding: '10px 6px calc(10px + env(safe-area-inset-bottom))', justifyContent: 'space-around', zIndex: 60 }}>
        {bottomNav.map(([key, label]) => (
          <button key={key} type="button" onClick={() => goScreen(key)} style={{ border: 'none', background: 'transparent', color: screen === key ? '#7c3aed' : 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}>
            {icons[key]}{label}
          </button>
        ))}
      </nav>

      {/* MODALS */}
      {modal === 'deposit' && (
        <Modal onClose={() => setModal(null)}>
          <ModalHeader title="Deposit funds" onClose={() => setModal(null)} />
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Amount (USD)</div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
            <span style={{ fontFamily: serif, fontSize: 26, color: 'var(--text-3)' }}>$</span>
            <input value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 26, color: 'var(--text)', width: '100%', marginLeft: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['10,000', '$10k'], ['25,000', '$25k'], ['50,000', '$50k'], ['100,000', '$100k']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setDepositAmt(v)} style={{ flex: 1, padding: 9, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Funding source</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ width: 40, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Bank transfer ····4821</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>Settles in 1–2 business days</div></div>
            <span style={{ color: 'var(--text-3)' }}>⌄</span>
          </div>
          <button type="button" onClick={() => setModal(null)} style={modalBtn()}>Confirm deposit</button>
        </Modal>
      )}

      {modal === 'withdraw' && (
        <Modal onClose={() => setModal(null)}>
          <ModalHeader title="Withdraw" onClose={() => setModal(null)} />
          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Available to withdraw</span><span style={{ fontFamily: serif, fontSize: 20, color: 'var(--text)' }}>$39,069</span></div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Amount (USD)</div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
            <span style={{ fontFamily: serif, fontSize: 26, color: 'var(--text-3)' }}>$</span>
            <input defaultValue="5,000" style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 26, color: 'var(--text)', width: '100%', marginLeft: 4 }} />
          </div>
          <button type="button" onClick={() => setModal(null)} style={modalBtn()}>Request withdrawal</button>
        </Modal>
      )}
    </div>
  )
}

/* ---------- small presentational helpers ---------- */
const card = (pad = 26, padTop) => ({
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: pad >= 24 ? 24 : 20, padding: padTop ? `${padTop}px` : pad === 26 ? '26px 26px 8px' : pad,
  boxShadow: 'var(--shadow)',
})
const linkBtn = () => ({ border: 'none', background: 'transparent', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })
const iconChip = (color, size) => ({ width: size, height: size, borderRadius: size === 38 ? 11 : 12, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flex: 'none' })
const modalBtn = () => ({ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px rgba(124,58,237,.32)', fontFamily: 'inherit' })

function TabGroup({ tabs, active, onChange }) {
  const normalized = tabs.map((t) => (Array.isArray(t) ? t : [t, t]))
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 11 }}>
      {normalized.map(([val, label]) => {
        const on = active === val
        return (
          <button key={val} type="button" onClick={() => onChange(val)}
            style={{ border: 'none', background: on ? 'var(--surface)' : 'transparent', color: on ? '#7c3aed' : 'var(--text-2)', fontSize: 12.5, fontWeight: 700, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', boxShadow: on ? '0 2px 8px rgba(124,58,237,.12)' : 'none' }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function StrategyCard({ name, grad, pctColor, pctBg, pct, desc, alloc, yld, icon }) {
  const [hover, setHover] = useState(false)
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, boxShadow: hover ? '0 30px 60px rgba(124,58,237,.16)' : 'var(--shadow)', cursor: 'pointer', transition: 'transform .35s,box-shadow .35s', transform: hover ? 'translateY(-6px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: pctColor, background: pctBg, padding: '5px 11px', borderRadius: 999 }}>{pct}</div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 18 }}>{desc}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div><div style={{ fontSize: 18, fontFamily: serif, color: 'var(--text)' }}>{alloc}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Allocated</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontFamily: serif, color: '#16a34a' }}>{yld}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Yield</div></div>
      </div>
    </div>
  )
}

function SettingRow({ title, sub, on, onToggle, border }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: border ? '1px solid var(--border)' : 'none' }}>
      <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</div><div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</div></div>
      <button type="button" onClick={onToggle} style={{ width: 48, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'var(--surface-3)', position: 'relative', transition: 'background .3s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: on ? 'none' : '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div data-modal style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,34,.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 30, boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
      <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)' }}>{title}</div>
      <button type="button" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 17, cursor: 'pointer' }}>✕</button>
    </div>
  )
}
