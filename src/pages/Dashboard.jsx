import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../dashboard/dashboard.css'
import { db } from '../lib/cocobase'
import { createDepositSession, checkPayment } from '../lib/listener'
import { useAuth } from '../hooks/useAuth'
import { holdings, txns, txIcon, txLabel, chg, reports, insights } from '../dashboard/data'
import {
  chartData, perfData, drawArea, drawDonut, drawBars, drawSpark, animate,
} from '../dashboard/charts'

const serif = "'DM Serif Display',serif"

const icons = {
  overview: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  portfolio: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8.5" cy="8.5" r="5" /><circle cx="15.5" cy="15.5" r="5" /></svg>,
  strategies: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>,
  activity: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v13M7 4l-3 3M7 4l3 3" /><path d="M17 20V7M17 20l3-3M17 20l-3-3" /></svg>,
  performance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 6" /></svg>,
  reports: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  insights: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  advisor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /><circle cx="9" cy="8" r="2.4" fill="var(--sidebar)" /><circle cx="15" cy="16" r="2.4" fill="var(--sidebar)" /></svg>,
}

const navItems = [
  ['overview', 'Overview'],
  ['portfolio', 'Portfolio'],
  ['strategies', 'Strategies'],
  ['activity', 'Activity'],
  ['performance', 'Performance'],
  ['reports', 'Reports'],
  ['insights', 'Market Insights'],
  ['advisor', 'Advisor Support'],
  ['settings', 'Settings'],
]

export default function Dashboard() {
  const rootRef = useRef(null)
  const areaRef = useRef(null)
  const donutRef = useRef(null)
  const perfRef = useRef(null)
  const barsRef = useRef(null)
  const navigate = useNavigate()
  const { user, loading, isAuthenticated } = useAuth()

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lumen-theme') || 'light' } catch { return 'light' }
  })
  const [screen, setScreen] = useState(() => {
    try { return localStorage.getItem('lumen-screen') || 'overview' } catch { return 'overview' }
  })
  const [navOpen, setNavOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [curTf, setCurTf] = useState('1M')
  const [curPerf, setCurPerf] = useState('1Y')
  const [hfilter, setHfilter] = useState('all')
  const [txfilter, setTxfilter] = useState('all')
  const [depositAmt, setDepositAmt] = useState('25,000')
  const [switches, setSwitches] = useState({ '2fa': true, bio: true, email: true })
  const [msgSent, setMsgSent] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [reportDownloaded, setReportDownloaded] = useState(null)

  // Real portfolio + plans from CocoBase
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [availablePlans, setAvailablePlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)

  const loadPortfolio = async () => {
    try {
      const res = await db.functions.execute('get-my-portfolio', { payload: {}, method: 'POST' })
      // execute() may return the function result directly or wrapped in { result }
      setPortfolio(res?.result ?? res ?? null)
    } catch {
      setPortfolio(null)
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    if (loading || !isAuthenticated) return
    loadPortfolio()
    db.listDocuments('lumen_plans', { sort: 'sort_order', order: 'asc', limit: 10 })
      .then((res) => {
        const plans = (res?.data ?? []).map((p) => ({ id: p.id, ...(p.data || {}) })).filter((p) => p.active !== false)
        setAvailablePlans(plans)
        if (plans.length && !selectedPlan) setSelectedPlan(plans[0])
      })
      .catch(() => {})
  }, [loading, isAuthenticated])

  // Auth guard — redirect to login if session is not found after loading
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login', { replace: true })
  }, [loading, isAuthenticated, navigate])

  const firstName = user?.data?.first_name || user?.first_name || ''
  const lastName = user?.data?.last_name || user?.last_name || ''
  const fullName = user?.data?.full_name || `${firstName} ${lastName}`.trim() || 'Investor'
  const userEmail = user?.email || ''
  const initials = (firstName[0] || '') + (lastName[0] || '') || fullName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    try { await db.auth.logout() } catch {}
    navigate('/login')
  }

  const title = navItems.find(([k]) => k === screen)?.[1] || ''

  useEffect(() => { try { localStorage.setItem('lumen-theme', theme) } catch {} }, [theme])
  useEffect(() => { try { localStorage.setItem('lumen-screen', screen) } catch {} }, [screen])

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

  useEffect(() => {
    rootRef.current?.querySelectorAll('[data-spark]').forEach((cv) => {
      drawSpark(cv, JSON.parse(cv.getAttribute('data-spark')), cv.getAttribute('data-color'))
    })
  }, [screen, hfilter, theme])

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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  const goScreen = (name) => { setScreen(name); setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const filteredHoldings = holdings.filter((h) => {
    if (hfilter === 'all') return true
    if (hfilter === 'staked') return h.staked
    if (hfilter === 'crypto') return !['USDC', 'USDT', 'USD'].includes(h.sym)
    return true
  })
  const filteredTx = txns.filter((t) => (txfilter === 'all' ? true : t.type === txfilter))

  // Deposit (USDT BEP-20) flow: step 'form' -> 'pay' -> 'done'
  const [depositStep, setDepositStep] = useState('form')
  const [depositAddress, setDepositAddress] = useState('')
  const [depositGenerating, setDepositGenerating] = useState(false)
  const [depositChecking, setDepositChecking] = useState(false)
  const [depositDone, setDepositDone] = useState(false)
  const [depositError, setDepositError] = useState('')
  const [copied, setCopied] = useState(false)
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawDone, setWithdrawDone] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('5,000')
  const [withdrawAddr, setWithdrawAddr] = useState('')

  const resetDeposit = () => {
    setDepositStep('form'); setDepositAddress(''); setDepositError('')
    setDepositDone(false); setCopied(false)
  }

  const handleSendMessage = () => {
    if (!msgText.trim()) return
    setMsgSent(true)
    setMsgText('')
    setTimeout(() => setMsgSent(false), 4000)
  }

  const handleDownload = (idx) => {
    setReportDownloaded(idx)
    setTimeout(() => setReportDownloaded(null), 2000)
  }

  // Step 1: validate + request the investor's unique BEP-20 deposit address
  const handleGenerateAddress = async () => {
    setDepositError('')
    if (!selectedPlan) { setDepositError('Please select an investment plan.'); return }
    const amt = parseFloat(depositAmt.replace(/,/g, ''))
    if (!amt || amt <= 0) { setDepositError('Enter a valid amount.'); return }
    if (amt < (selectedPlan.min_usd || 0)) {
      setDepositError(`Minimum for ${selectedPlan.name} is $${(selectedPlan.min_usd || 0).toLocaleString()}.`); return
    }
    if (selectedPlan.max_usd > 0 && amt > selectedPlan.max_usd) {
      setDepositError(`Maximum for ${selectedPlan.name} is $${selectedPlan.max_usd.toLocaleString()}.`); return
    }
    setDepositGenerating(true)
    try {
      const session = await createDepositSession({
        userId: user.id, userEmail: userEmail, userName: fullName, plan: selectedPlan,
      })
      setDepositAddress(session.address)
      setDepositStep('pay')
    } catch (err) {
      setDepositError(err?.message || 'Could not start deposit. The deposit service may be offline.')
    } finally {
      setDepositGenerating(false)
    }
  }

  // Step 2: investor clicks "I've sent the payment" — ask listener to scan now, then poll
  const handleConfirmPayment = async () => {
    setDepositError('')
    setDepositChecking(true)
    const before = portfolio?.investment_count ?? 0
    try {
      await checkPayment(user.id)
      // Poll get-my-portfolio for up to ~40s for the new investment to appear
      let found = false
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 5000))
        const res = await db.functions.execute('get-my-portfolio', { payload: {}, method: 'POST' })
        const p = res?.result ?? res
        if (p && p.investment_count > before) { setPortfolio(p); found = true; break }
        await checkPayment(user.id).catch(() => {})
      }
      if (found) {
        setDepositDone(true)
        setDepositStep('done')
        setTimeout(() => { setModal(null); resetDeposit() }, 4000)
      } else {
        setDepositError("We haven't seen your transfer yet. It can take a few minutes to confirm on BSC — keep this open or check back shortly.")
      }
    } catch (err) {
      setDepositError(err?.message || 'Could not verify payment. Please try again in a moment.')
    } finally {
      setDepositChecking(false)
    }
  }

  const handleWithdrawSubmit = async () => {
    setWithdrawError('')
    const addr = withdrawAddr.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setWithdrawError('Enter a valid USDT BEP-20 (BSC) wallet address starting with 0x.'); return
    }
    const amt = parseFloat(withdrawAmt.replace(/,/g, ''))
    if (!amt || amt <= 0) { setWithdrawError('Enter a valid amount.'); return }
    setWithdrawSubmitting(true)
    try {
      const res = await db.functions.execute('submit-withdrawal', {
        payload: { amount: String(amt), bank_details: addr, network: 'USDT BEP-20' },
        method: 'POST',
      })
      const result = res?.result ?? res
      if (result?.error) throw new Error(result.error)
      setWithdrawDone(true)
      loadPortfolio()
      setTimeout(() => { setWithdrawDone(false); setModal(null) }, 3000)
    } catch (err) {
      setWithdrawError(err?.message || 'Could not submit withdrawal. Please try again.')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf7ff' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e7e7ec', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div ref={rootRef} data-root data-theme={theme} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', transition: 'background .4s ease,color .4s ease' }}>

      {/* MOBILE OVERLAY */}
      <div
        data-dash-overlay
        onClick={() => setNavOpen(false)}
        style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(14,12,22,.5)', backdropFilter: 'blur(4px)', opacity: navOpen ? 1 : 0, pointerEvents: navOpen ? 'auto' : 'none', transition: 'opacity .35s ease' }}
      />

      {/* SIDEBAR */}
      <aside
        data-sidebar
        {...(navOpen ? { 'data-open': '' } : {})}
        style={{ width: 270, flex: 'none', position: 'fixed', top: 0, left: 0, height: '100vh', background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '22px 16px', zIndex: 50, transition: 'background .4s,border-color .4s,transform .38s cubic-bezier(.16,1,.3,1)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 24px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sidebar)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: serif, fontSize: 16, color: 'var(--text)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lumen</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Investor Portal</div>
          </div>
          <button
            data-dash-hamburger
            type="button"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
            style={{ width: 32, height: 32, flex: 'none', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, padding: '0 12px 8px' }}>Dashboard</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.slice(0, 5).map(([key, label]) => {
            const active = screen === key
            return (
              <button key={key} type="button" onClick={() => goScreen(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 12, border: 'none', background: active ? 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(236,72,153,.12))' : 'transparent', color: active ? '#7c3aed' : 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'background .2s,color .2s', fontFamily: 'inherit' }}>
                {icons[key]} {label}
              </button>
            )
          })}
        </nav>

        <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, padding: '18px 12px 8px' }}>Resources</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.slice(5).map(([key, label]) => {
            const active = screen === key
            return (
              <button key={key} type="button" onClick={() => goScreen(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 12, border: 'none', background: active ? 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(236,72,153,.12))' : 'transparent', color: active ? '#7c3aed' : 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'background .2s,color .2s', fontFamily: 'inherit' }}>
                {icons[key]} {label}
              </button>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'linear-gradient(150deg,#7c3aed,#ec4899)', borderRadius: 16, padding: '16px 18px', color: '#fff' }}>
            <div style={{ fontFamily: serif, fontSize: 16, marginBottom: 4 }}>Grow your portfolio</div>
            <div style={{ fontSize: 12, opacity: .88, lineHeight: 1.5, marginBottom: 12 }}>Add capital to unlock higher-yield strategies.</div>
            <button type="button" onClick={() => setModal('deposit')} style={{ width: '100%', padding: 9, borderRadius: 9, border: 'none', background: '#fff', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Fund Portfolio</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flex: 'none' }}>{initials || '?'}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main data-main style={{ flex: 1, marginLeft: 270, padding: '0 clamp(18px,3vw,38px) 48px', minWidth: 0 }}>

        {/* TOPBAR */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', background: 'var(--bg)', transition: 'background .4s' }}>
          <button
            data-dash-hamburger
            type="button"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            style={{ width: 42, height: 42, flex: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', gap: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 data-pagetitle style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(24px,3vw,32px)', margin: 0, color: 'var(--text)' }}>{title}</h1>
          </div>
          <div data-topbar-search style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', width: 220 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
            <input placeholder="Search…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <button type="button" data-hidemobile onClick={() => setModal('withdraw')} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Withdraw</button>
          <button type="button" onClick={() => setModal('deposit')} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 24px rgba(124,58,237,.32)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Deposit</button>
          <button type="button" onClick={toggleTheme} style={{ width: 44, height: 44, flex: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
        </div>

        {/* ── OVERVIEW ── */}
        {screen === 'overview' && (
          <section data-pane="overview">
            {/* EMPTY STATE — no investments yet */}
            {!portfolioLoading && (!portfolio || portfolio.investment_count === 0) && (
              <div style={{ ...card(40), textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 46, marginBottom: 14 }}>🌱</div>
                <div style={{ fontFamily: serif, fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>Start your first investment</div>
                <div style={{ fontSize: 14.5, color: 'var(--text-3)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  You don't have any active investments yet. Choose a plan, deposit from $5,000, and the Lumen team will put your capital to work.
                </div>
                {portfolio?.deposits?.some((d) => d.status === 'pending') ? (
                  <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 12, background: 'rgba(245,158,11,.12)', color: '#b45309', fontSize: 14, fontWeight: 700 }}>
                    ⏳ You have a deposit pending review — we'll activate it shortly.
                  </div>
                ) : (
                  <button type="button" onClick={() => setModal('deposit')} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 28px rgba(124,58,237,.3)' }}>
                    Choose a plan & invest →
                  </button>
                )}
              </div>
            )}

            {/* REAL PORTFOLIO — has investments */}
            {!portfolioLoading && portfolio && portfolio.investment_count > 0 && (
              <>
                <div data-overviewgrid style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div style={card()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Total portfolio value</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                          <div style={{ fontFamily: serif, fontSize: 'clamp(34px,4vw,46px)', color: 'var(--text)', lineHeight: 1 }}>${money(portfolio.total_value)}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(34,197,94,.12)', color: '#16a34a', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>▲ {portfolio.return_pct}%</div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>+${money(portfolio.total_earnings)} earnings · Capital invested: ${money(portfolio.total_principal)}</div>
                      </div>
                    </div>
                    <canvas ref={areaRef} style={{ width: '100%', height: 230, marginTop: 10 }} />
                  </div>

                  <div style={card(24)}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Allocation</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>Across {portfolio.investment_count} active {portfolio.investment_count === 1 ? 'plan' : 'plans'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <canvas ref={donutRef} style={{ width: 180, height: 180 }} />
                      <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Plans</div>
                        <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)' }}>{portfolio.investment_count}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
                      {portfolio.investments.map((inv, i) => {
                        const pctOfTotal = portfolio.total_value > 0 ? ((inv.current_value / portfolio.total_value) * 100).toFixed(1) : '0.0'
                        return (
                          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: PLAN_COLORS[i % PLAN_COLORS.length], flex: 'none' }} />
                            <span style={{ color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.plan_name}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text)', flex: 'none' }}>{pctOfTotal}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div data-grid4 style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Total return', val: `+${portfolio.return_pct}%`, sub: '▲ Since investment', subColor: '#16a34a' },
                    { label: 'Earnings to date', val: `$${money(portfolio.total_earnings)}`, sub: '▲ Accruing daily', subColor: '#16a34a' },
                    { label: 'Capital invested', val: `$${money(portfolio.total_principal)}`, sub: 'Principal', subColor: 'var(--text-3)' },
                    { label: 'Active plans', val: String(portfolio.investment_count), sub: 'Earning returns', subColor: 'var(--text-3)' },
                  ].map((s) => (
                    <div key={s.label} style={card(20, 20)}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>{s.label}</div>
                      <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)' }}>{s.val}</div>
                      <div style={{ fontSize: 11.5, color: s.subColor, fontWeight: 700, marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* WHERE YOUR MONEY IS INVESTED — real */}
                <div style={{ ...card(24), marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Where your money is invested</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>Your ${money(portfolio.total_principal)} across {portfolio.investment_count} {portfolio.investment_count === 1 ? 'plan' : 'plans'}</div>
                    </div>
                    <button type="button" onClick={() => setModal('deposit')} style={linkBtn()}>+ Add investment</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {portfolio.investments.map((inv, i) => (
                      <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 13, background: PLAN_GRADS[i % PLAN_GRADS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, flex: 'none' }}>◈</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{inv.plan_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Invested {new Date(inv.start_date).toLocaleDateString()} · {inv.annual_return_pct}% p.a.</div>
                        </div>
                        <div style={{ textAlign: 'right', flex: 'none' }}>
                          <div style={{ fontFamily: serif, fontSize: 18, color: 'var(--text)', fontWeight: 400 }}>${money(inv.current_value)}</div>
                          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>+${money(inv.earnings)} earned</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* RECENT ACTIVITY — real deposits/withdrawals */}
            {!portfolioLoading && portfolio && (portfolio.deposits?.length > 0 || portfolio.withdrawals?.length > 0) && (
              <div style={{ ...card(24), marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Recent activity</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    ...(portfolio.deposits || []).map((d) => ({ ...d, kind: 'deposit' })),
                    ...(portfolio.withdrawals || []).map((w) => ({ ...w, kind: 'withdrawal' })),
                  ]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 6)
                    .map((t) => {
                      const isDep = t.kind === 'deposit'
                      const col = t.status === 'approved' ? '#16a34a' : t.status === 'rejected' ? '#ef4444' : '#f59e0b'
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${col}1e`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 14, fontWeight: 800 }}>{isDep ? '↓' : '↑'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{isDep ? `Deposit · ${t.plan_name || 'Plan'}` : 'Withdrawal'}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''} · <span style={{ color: col, fontWeight: 700, textTransform: 'capitalize' }}>{t.status}</span></div>
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: isDep ? '#16a34a' : 'var(--text)', textAlign: 'right', flex: 'none' }}>{isDep ? '+' : '−'}${money(t.amount || 0)}</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Latest insight teaser */}
            <div style={{ ...card(24), marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Latest from the investment team</div>
                <button type="button" onClick={() => goScreen('insights')} style={linkBtn()}>View all insights →</button>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 18 }}>📊</div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#7c3aed', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>{insights[0].tag} · {insights[0].date}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{insights[0].headline}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.55 }}>{insights[0].body.slice(0, 140)}…</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PORTFOLIO ── */}
        {screen === 'portfolio' && (
          <section data-pane="portfolio">
            <div style={card(24)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>All holdings</div>
                <TabGroup tabs={[['all', 'All'], ['crypto', 'Crypto'], ['staked', 'Earning Yield']]} active={hfilter} onChange={setHfilter} />
              </div>
              <div data-hidemobile style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.2fr 1fr 1.3fr', gap: 14, padding: '0 6px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                <div>Asset</div><div>Holdings</div><div>Price</div><div>24h</div><div style={{ textAlign: 'right' }}>Value</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredHoldings.map((h) => {
                  const c = chg(h.chg)
                  return (
                    <div key={h.name} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.2fr 1fr 1.3fr', gap: 14, alignItems: 'center', padding: '15px 6px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={iconChip(h.color, 40)}>{h.sym.slice(0, 3)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.sym}{h.staked ? ' · Earning yield' : ''}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 600 }}>{h.amt}</div>
                      <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{h.price}</div>
                      <div style={{ fontSize: 13, color: c.col, fontWeight: 700 }}>{c.text}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <canvas data-hidemobile data-spark={JSON.stringify(h.spark)} data-color={h.color} style={{ width: 60, height: 30 }} />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{h.val}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{h.pct}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ ...card(24), marginTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Portfolio summary</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Your capital is professionally allocated across Bitcoin, Ethereum, and stablecoin yield products, managed by the Lumen investment team.</div>
              <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '45.0%', background: '#f59e0b' }} />
                <div style={{ width: '28.2%', background: '#6366f1' }} />
                <div style={{ width: '13.2%', background: '#2563eb' }} />
                <div style={{ width: '9.0%', background: '#16a34a' }} />
                <div style={{ width: '4.6%', background: '#8b8b97' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>
                {[['Bitcoin', '#f59e0b', '45.0%'], ['Ethereum', '#6366f1', '28.2%'], ['USDC Yield', '#2563eb', '13.2%'], ['USDT Reserve', '#16a34a', '9.0%'], ['Other', '#8b8b97', '4.6%']].map(([n, c, p]) => (
                  <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{n} {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── STRATEGIES ── */}
        {screen === 'strategies' && (
          <section data-pane="strategies">
            <div data-grid3 style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 20 }}>
              {[
                {
                  name: 'Growth Strategy', grad: 'linear-gradient(135deg,#f59e0b,#f97316)', pctColor: '#f59e0b', pctBg: 'rgba(245,158,11,.1)', pct: '35%',
                  desc: 'Maximum long-term capital appreciation through concentrated Bitcoin and Ethereum positions.',
                  alloc: '$120,000', ret: '+22%',
                  icon: <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '15px solid #fff' }} />,
                  detail: 'Bitcoin (70%) · Ethereum (30%)',
                },
                {
                  name: 'Balanced Strategy', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', pctColor: '#7c3aed', pctBg: 'rgba(124,58,237,.1)', pct: '40%',
                  desc: 'Diversified exposure to growth through BTC and ETH, balanced with stablecoin yield positions.',
                  alloc: '$100,000', ret: '+15%',
                  icon: <div style={{ width: 18, height: 18, border: '3px solid #fff', borderRadius: 5 }} />,
                  detail: 'Bitcoin (40%) · Ethereum (35%) · Stable (25%)',
                },
                {
                  name: 'Conservative Strategy', grad: 'linear-gradient(135deg,#2563eb,#06b6d4)', pctColor: '#2563eb', pctBg: 'rgba(37,99,235,.1)', pct: '25%',
                  desc: 'Capital preservation through stablecoin yield opportunities and conservative digital asset exposure.',
                  alloc: '$52,000', ret: '+9%',
                  icon: <div style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid #fff' }} />,
                  detail: 'Stablecoin Yield (75%) · Conservative Crypto (25%)',
                },
              ].map((s) => <StrategyCard key={s.name} {...s} />)}
            </div>

            <div style={card(24)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Strategy allocation overview</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Your capital is spread across three distinct mandates, each managed independently with its own risk parameters and target return profile.</div>
              <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '35%', background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
                <div style={{ width: '40%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                <div style={{ width: '25%', background: 'linear-gradient(90deg,#2563eb,#06b6d4)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>
                <span>Growth 35%</span><span>Balanced 40%</span><span>Conservative 25%</span>
              </div>
            </div>

            <div style={{ ...card(24), marginTop: 20, background: 'linear-gradient(135deg,rgba(124,58,237,.06),rgba(236,72,153,.04))' }}>
              <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}>Quarterly Review · Q2 2026</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Your portfolio outperformed its benchmark by 3.2% this quarter.</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 18 }}>The Growth Strategy delivered +22% annualized, driven by Bitcoin's appreciation. The Balanced Strategy returned +15%, while the Conservative Strategy generated a consistent +9% through stablecoin yield positions.</div>
              <button type="button" onClick={() => goScreen('reports')} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Download Q2 Report →</button>
            </div>
          </section>
        )}

        {/* ── ACTIVITY ── */}
        {screen === 'activity' && (
          <section data-pane="activity">
            <div style={card(24)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Transaction history</div>
                <TabGroup tabs={[['all', 'All'], ['deposit', 'Deposits'], ['yield', 'Yield'], ['withdraw', 'Withdrawals']]} active={txfilter} onChange={setTxfilter} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTx.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 6px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${txIcon[t.type]}1e`, color: txIcon[t.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 16, fontWeight: 800 }}>{txLabel[t.type] || '·'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{t.label}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{t.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: t.sign > 0 ? '#16a34a' : t.sign < 0 ? '#ef4444' : 'var(--text-3)' }}>{t.amt}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PERFORMANCE ── */}
        {screen === 'performance' && (
          <section data-pane="performance">
            <div style={{ ...card(26), marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>Cumulative return</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ fontFamily: serif, fontSize: 40, color: 'var(--text)', lineHeight: 1 }}>+18.6%</div>
                    <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>since inception</div>
                  </div>
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
                {[
                  ['Total invested', '$272,000', 'var(--text)'],
                  ['Current value', '$322,750', 'var(--text)'],
                  ['Total return', '+$50,750', '#16a34a'],
                  ['Return %', '+18.6%', '#16a34a'],
                  ['Annual yield earned', '$4,820', '#f59e0b'],
                  ['Best month', '+6.2%', '#16a34a'],
                  ['Max drawdown', '−8.4%', 'var(--text)'],
                  ['Risk profile', 'Balanced', 'var(--text)'],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{k}</span>
                    <span style={{ fontWeight: 700, color: c, fontSize: 13.5 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 'auto', background: 'var(--surface-2)', borderRadius: 14, padding: 14, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Returns shown net of management fees. Past performance does not guarantee future results.</div>
              </div>
            </div>
          </section>
        )}

        {/* ── REPORTS ── */}
        {screen === 'reports' && (
          <section data-pane="reports">
            <div style={card(24)}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Reports Center</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', marginBottom: 24 }}>Download your official Lumen investment reports, statements, and tax documents.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {reports.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 6px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 18 }}>
                      📄
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{r.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{r.period} · {r.size}</div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{r.date}</div>
                      <button
                        type="button"
                        onClick={() => handleDownload(i)}
                        style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: reportDownloaded === i ? '#16a34a' : 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .3s' }}
                      >
                        {reportDownloaded === i ? '✓ Downloaded' : '↓ Download PDF'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card(24), marginTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Request a custom report</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>Need a specific report or document? Contact your portfolio management team and we'll prepare it for you within 2 business days.</div>
              <button type="button" onClick={() => goScreen('advisor')} style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: 'var(--text)', color: 'var(--sidebar)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Contact portfolio team →</button>
            </div>
          </section>
        )}

        {/* ── MARKET INSIGHTS ── */}
        {screen === 'insights' && (
          <section data-pane="insights">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {insights.map((ins, i) => (
                <div key={i} style={card(24)}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(124,58,237,.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 20 }}>
                      {i === 0 ? '📈' : i === 1 ? '🛡️' : i === 2 ? '💰' : '⚖️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,.1)', padding: '3px 9px', borderRadius: 6 }}>{ins.tag}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{ins.date}</span>
                      </div>
                      <div style={{ fontFamily: serif, fontSize: 20, color: 'var(--text)', marginBottom: 10, lineHeight: 1.25 }}>{ins.headline}</div>
                      <div style={{ fontSize: 14.5, color: 'var(--text-3)', lineHeight: 1.65 }}>{ins.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...card(24), marginTop: 16, background: 'linear-gradient(135deg,rgba(14,14,18,.96),rgba(30,20,50,.98))', border: 'none' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Subscribe to updates</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: '#fff', marginBottom: 8 }}>Receive monthly commentary from the Lumen investment team.</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.6)', marginBottom: 20, lineHeight: 1.55 }}>Market insights, portfolio updates, and quarterly outlooks — delivered directly to your inbox.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" placeholder="you@example.com" style={{ flex: 1, padding: '12px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <button type="button" style={{ padding: '12px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Subscribe</button>
              </div>
            </div>
          </section>
        )}

        {/* ── ADVISOR SUPPORT ── */}
        {screen === 'advisor' && (
          <section data-pane="advisor">
            <div data-grid2 style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {[
                { emoji: '📅', title: 'Schedule Investment Review', desc: 'Book a 30-minute call with your portfolio manager to discuss performance, strategy, and your financial goals.', action: 'Schedule a call', color: '#7c3aed' },
                { emoji: '📋', title: 'Quarterly Review Call', desc: 'Join a dedicated Q2 2026 review session. We\'ll walk through your portfolio performance and answer any questions.', action: 'Book Q2 review', color: '#ec4899' },
                { emoji: '🔐', title: 'Secure Messaging', desc: 'Send an encrypted message directly to the Lumen portfolio management team.', action: null, color: '#6366f1' },
                { emoji: '📥', title: 'Request Documents', desc: 'Need your investment agreement, KYC documents, or a custom report? Request them here and we\'ll deliver within 2 business days.', action: 'Request documents', color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} style={card(24)}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{item.emoji}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 20 }}>{item.desc}</div>
                  {item.action ? (
                    <button type="button" style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: item.color, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{item.action}</button>
                  ) : (
                    <div>
                      <textarea
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        placeholder="Type your message to the portfolio team…"
                        rows={3}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: msgSent ? '#16a34a' : item.color, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .3s' }}
                      >
                        {msgSent ? '✓ Message sent!' : 'Send message'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={card(24)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Your dedicated advisor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flex: 'none' }}>SM</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Sarah Mitchell</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Senior Portfolio Manager · Lumen</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 3 }}>● Available Mon–Fri, 9am–5pm GMT</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 18 }}>
                Sarah manages your Growth Strategy allocation and is your primary point of contact at Lumen. She conducts your quarterly portfolio reviews and is available for any questions about your investment.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: 'var(--text)', color: 'var(--sidebar)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Send secure message</button>
                <button type="button" style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Schedule a call</button>
              </div>
            </div>
          </section>
        )}

        {/* ── SETTINGS ── */}
        {screen === 'settings' && (
          <section data-pane="settings">
            <div data-grid2 style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={card(26)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>{initials || '?'}</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{userEmail}</div>
                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, marginTop: 3 }}>Lumen Investor Account</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    ['Full name', fullName || '—'],
                    ['Email', userEmail || '—'],
                    ['KYC status', '✓ Verified'],
                    ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>{k}</div>
                      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px', fontSize: 14, color: 'var(--text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card(26)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Security &amp; preferences</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { key: '2fa', title: 'Two-factor authentication', sub: 'Extra layer of account security' },
                    { key: 'bio', title: 'Biometric login', sub: 'Face ID / fingerprint on mobile' },
                    { key: 'email', title: 'Monthly Investor Letter', sub: 'Receive the Lumen newsletter' },
                  ].map((row, i) => (
                    <SettingRow key={row.key} {...row} on={switches[row.key]} onToggle={() => setSwitches((s) => ({ ...s, [row.key]: !s[row.key] }))} border={i < 3} />
                  ))}
                  <SettingRow title="Dark appearance" sub="Toggle light / dark theme" on={theme === 'dark'} onToggle={toggleTheme} border={false} />
                </div>
                <button type="button" onClick={handleSignOut} style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: 22, padding: 13, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
              </div>
            </div>
          </section>
        )}
      </main>


      {/* DEPOSIT MODAL — USDT BEP-20 */}
      {modal === 'deposit' && (
        <Modal onClose={() => { setModal(null); resetDeposit() }}>
          <ModalHeader title={depositStep === 'pay' ? 'Send USDT (BEP-20)' : 'Fund Portfolio'} onClose={() => { setModal(null); resetDeposit() }} />

          {/* STEP: success */}
          {depositStep === 'done' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Payment confirmed</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>Your USDT was received on-chain and your {selectedPlan?.name} investment is now active and earning returns.</div>
            </div>
          ) : depositStep === 'pay' ? (
            /* STEP: pay — show the unique address + QR */
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Send <b style={{ color: 'var(--text)' }}>exactly ${money(parseFloat(depositAmt.replace(/,/g, '')) || 0)} in USDT</b> on the <b style={{ color: 'var(--text)' }}>BNB Smart Chain (BEP-20)</b> network to the address below. Your {selectedPlan?.name} investment activates automatically once it confirms.
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--border)' }}>
                  <img
                    alt="Deposit address QR"
                    width={170} height={170}
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(depositAddress)}`}
                    style={{ display: 'block' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Your USDT BEP-20 deposit address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', wordBreak: 'break-all' }}>{depositAddress}</span>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(depositAddress); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                  style={{ flex: 'none', padding: '8px 12px', borderRadius: 9, border: 'none', background: copied ? '#16a34a' : 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 12, padding: '11px 14px', marginBottom: 18, fontSize: 12, color: '#b45309', lineHeight: 1.5 }}>
                <span style={{ flex: 'none' }}>⚠️</span>
                <span>Send <b>USDT on BEP-20 only</b>. Sending any other token or using another network (ERC-20, TRC-20) will result in permanent loss of funds.</span>
              </div>

              {depositError && <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginBottom: 14 }}>{depositError}</div>}

              <button type="button" onClick={handleConfirmPayment} disabled={depositChecking} style={{ ...modalBtn(), opacity: depositChecking ? 0.75 : 1, cursor: depositChecking ? 'wait' : 'pointer' }}>
                {depositChecking ? 'Checking the blockchain…' : "I've sent the payment"}
              </button>
              <button type="button" onClick={resetDeposit} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Change plan or amount
              </button>
            </>
          ) : (
            /* STEP: form — choose plan + amount */
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Choose a plan and amount, then send USDT (BEP-20). Your investment activates automatically once the transfer confirms on-chain.
              </div>

              {/* PLAN PICKER */}
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Choose your plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {availablePlans.map((p) => {
                  const active = selectedPlan?.id === p.id
                  const isPrivate = p.slug === 'private' || p.annual_return_pct === 0
                  return (
                    <button key={p.id} type="button" onClick={() => { setSelectedPlan(p); setDepositAmt((p.min_usd || 0).toLocaleString()) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${active ? '#7c3aed' : 'var(--border)'}`, background: active ? 'rgba(124,58,237,.06)' : 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? '#7c3aed' : 'var(--border)'}`, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#7c3aed' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Min ${(p.min_usd || 0).toLocaleString()} · {p.risk} risk</div>
                      </div>
                      <div style={{ textAlign: 'right', flex: 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{isPrivate ? 'Bespoke' : `${p.annual_return_pct}% p.a.`}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Amount (USDT)</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <span style={{ fontFamily: serif, fontSize: 26, color: 'var(--text-3)' }}>$</span>
                <input value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 26, color: 'var(--text)', width: '100%', marginLeft: 4 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>USDT</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['10,000', '$10k'], ['25,000', '$25k'], ['50,000', '$50k'], ['100,000', '$100k']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setDepositAmt(v)} style={{ flex: 1, padding: 9, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
                ))}
              </div>

              {depositError && <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{depositError}</div>}
              <button type="button" onClick={handleGenerateAddress} disabled={depositGenerating} style={{ ...modalBtn(), opacity: depositGenerating ? 0.7 : 1, cursor: depositGenerating ? 'wait' : 'pointer' }}>
                {depositGenerating ? 'Preparing…' : 'Continue to payment →'}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* WITHDRAW MODAL */}
      {modal === 'withdraw' && (
        <Modal onClose={() => { setModal(null); setWithdrawDone(false); setWithdrawError('') }}>
          <ModalHeader title="Request Withdrawal" onClose={() => { setModal(null); setWithdrawDone(false); setWithdrawError('') }} />
          {withdrawDone ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Withdrawal request submitted</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>Once approved, your USDT will be sent on the BNB Smart Chain (BEP-20) to the address you provided, typically within 2–5 business days.</div>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Withdrawals are paid in <b style={{ color: 'var(--text)' }}>USDT on the BNB Smart Chain (BEP-20)</b> to your wallet, after team review.
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Available to withdraw</span>
                <span style={{ fontFamily: serif, fontSize: 20, color: 'var(--text)' }}>${money(portfolio?.total_value || 0)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Amount (USDT)</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                <span style={{ fontFamily: serif, fontSize: 26, color: 'var(--text-3)' }}>$</span>
                <input value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 26, color: 'var(--text)', width: '100%', marginLeft: 4 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>USDT</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>Your USDT BEP-20 wallet address</div>
              <input value={withdrawAddr} onChange={(e) => setWithdrawAddr(e.target.value)} placeholder="0x…"
                style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 14px', fontSize: 13.5, fontFamily: 'monospace', color: 'var(--text)', outline: 'none', marginBottom: 18, boxSizing: 'border-box' }} />
              {withdrawError && <div style={{ background: '#fff5f5', border: '1px solid #f6cccc', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{withdrawError}</div>}
              <button type="button" onClick={handleWithdrawSubmit} disabled={withdrawSubmitting} style={{ ...modalBtn(), opacity: withdrawSubmitting ? 0.7 : 1, cursor: withdrawSubmitting ? 'wait' : 'pointer' }}>
                {withdrawSubmitting ? 'Submitting…' : 'Submit withdrawal request'}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

/* ─── helpers ─── */
const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const PLAN_COLORS = ['#7c3aed', '#f59e0b', '#2563eb', '#16a34a', '#ec4899']
const PLAN_GRADS = [
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#2563eb,#06b6d4)',
  'linear-gradient(135deg,#16a34a,#22c55e)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
]
const card = (pad = 26, padTop) => ({
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: pad >= 24 ? 24 : 20, padding: padTop ? `${padTop}px` : pad === 26 ? '26px 26px 8px' : pad,
  boxShadow: 'var(--shadow)',
})
const linkBtn = () => ({ border: 'none', background: 'transparent', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })
const iconChip = (color, size) => ({ width: size, height: size, borderRadius: size === 38 ? 11 : 12, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11.5, flex: 'none' })
const modalBtn = () => ({ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px rgba(124,58,237,.32)', fontFamily: 'inherit' })

function TabGroup({ tabs, active, onChange }) {
  const normalized = tabs.map((t) => (Array.isArray(t) ? t : [t, t]))
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 11, flexWrap: 'wrap' }}>
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

function StrategyCard({ name, grad, pctColor, pctBg, pct, desc, alloc, ret, icon, detail }) {
  const [hover, setHover] = useState(false)
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, boxShadow: hover ? '0 30px 60px rgba(124,58,237,.16)' : 'var(--shadow)', cursor: 'pointer', transition: 'transform .35s,box-shadow .35s', transform: hover ? 'translateY(-6px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: pctColor, background: pctBg, padding: '5px 11px', borderRadius: 999 }}>{pct} of portfolio</div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 8 }}>{desc}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18, fontStyle: 'italic' }}>{detail}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div><div style={{ fontSize: 18, fontFamily: serif, color: 'var(--text)' }}>{alloc}</div><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Allocated</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontFamily: serif, color: '#16a34a' }}>{ret}</div><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Annual return</div></div>
      </div>
    </div>
  )
}

function SettingRow({ title, sub, on, onToggle, border }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: border ? '1px solid var(--border)' : 'none' }}>
      <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</div><div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</div></div>
      <button type="button" onClick={onToggle} style={{ width: 48, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'var(--surface-3)', position: 'relative', transition: 'background .3s', flex: 'none' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: on ? 'none' : '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div data-modal style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,34,.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 30, boxShadow: '0 40px 90px rgba(0,0,0,.4)' }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
      <div style={{ fontFamily: serif, fontSize: 24, color: 'var(--text)' }}>{title}</div>
      <button type="button" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 17, cursor: 'pointer' }}>✕</button>
    </div>
  )
}
