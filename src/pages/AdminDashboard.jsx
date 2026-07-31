import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../lib/cocobase'
import { listAllDepositMethods, saveDepositMethod, deleteDepositMethod } from '../lib/deposits'
import { useAuth } from '../hooks/useAuth'
import BrandSplash from '../components/BrandSplash'

const serif = "'DM Serif Display',serif"
const C = {
  bg: '#f8f6fc', surface: '#fff', border: '#e8e3f0',
  ink: '#111018', body: '#3d3450', muted: '#8a829a',
  primary: '#6d28d9', pink: '#7c3aed',
  green: '#16a34a', red: '#ef4444', amber: '#f59e0b',
}

const card = (pad = 24) => ({
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: pad,
  boxShadow: '0 2px 10px rgba(109,40,217,.05)',
})

function Avatar({ u, size = 38 }) {
  const name = u?.data?.full_name || u?.data?.first_name || u?.email || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#c026d3)', color: '#fff', fontWeight: 700, fontSize: size * 0.36, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      {name.trim().slice(0, 2).toUpperCase()}
    </div>
  )
}

function displayName(u) {
  return u?.data?.full_name || [u?.data?.first_name, u?.data?.last_name].filter(Boolean).join(' ') || u?.email || 'Unknown'
}

function accrued(principal, annualPct, startIso) {
  const start = new Date(startIso)
  if (isNaN(start)) return 0
  const days = Math.max((Date.now() - start.getTime()) / 86400000, 0)
  return principal * (annualPct / 100) * (days / 365)
}

// Sum a single investor's active investments → { principal, earnings, value, count }
function investorTotals(userId, investments) {
  let principal = 0, earnings = 0, count = 0
  for (const inv of investments) {
    const d = inv.data || {}
    if (d.user_id !== userId || d.status !== 'active') continue
    const p = Number(d.principal || 0)
    principal += p
    earnings += accrued(p, Number(d.annual_return_pct || 0), d.start_date)
    count++
  }
  return { principal, earnings, value: principal + earnings, count }
}

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

function StatusBadge({ status }) {
  const map = { pending: [C.amber, '#fffbeb', '⏳'], approved: [C.green, '#f0fdf4', '✓'], rejected: [C.red, '#fef2f2', '✕'] }
  const [color, bg, icon] = map[status] || [C.muted, C.bg, '·']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: bg, color }}>
      {icon} {status}
    </span>
  )
}

const NAV = [
  ['overview', 'Overview'],
  ['investors', 'Investors'],
  ['deposits', 'Deposits'],
  ['methods', 'Deposit Methods'],
  ['withdrawals', 'Withdrawals'],
  ['plans', 'Plans'],
  ['portfolio', 'Portfolio Mgmt'],
  ['messages', 'Messages'],
]

const BLANK_METHOD = {
  name: '', symbol: '', network: '', wallet_address: '',
  instructions: '', min_amount: 0, active: true, sort_order: 0,
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, isAdmin } = useAuth()

  const [screen, setScreen] = useState('overview')
  const [users, setUsers] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [plans, setPlans] = useState([])
  const [investments, setInvestments] = useState([])
  const [messages, setMessages] = useState([])
  const [activeMsg, setActiveMsg] = useState(null)      // message being viewed/replied to
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [composing, setComposing] = useState(false)     // compose new email modal
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' })
  const [composeBusy, setComposeBusy] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionNote, setActionNote] = useState({})
  const [toast, setToast] = useState('')
  const [editingPlan, setEditingPlan] = useState(null)
  const [planSaving, setPlanSaving] = useState(false)
  // Fund/defund manager
  const [managing, setManaging] = useState(null)       // the investor being managed
  const [fundAmount, setFundAmount] = useState('')
  const [fundPlanId, setFundPlanId] = useState('')
  const [fundBusy, setFundBusy] = useState(false)
  // Deposit methods (the wallets investors send funds to)
  const [methods, setMethods] = useState([])
  const [editingMethod, setEditingMethod] = useState(null)
  const [methodSaving, setMethodSaving] = useState(false)
  const [methodBusy, setMethodBusy] = useState(null)
  const [copiedAddr, setCopiedAddr] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const loadMethods = useCallback(async () => {
    try {
      setMethods(await listAllDepositMethods())
    } catch {
      setMethods([])
    }
  }, [])

  const saveMethod = async () => {
    if (!editingMethod) return
    if (!editingMethod.name?.trim()) { showToast('Give the method a name (e.g. Bitcoin)'); return }
    if (!editingMethod.wallet_address?.trim()) { showToast('A wallet address is required'); return }
    setMethodSaving(true)
    try {
      await saveDepositMethod({
        id: editingMethod.id,
        name: editingMethod.name.trim(),
        symbol: (editingMethod.symbol || '').trim(),
        network: (editingMethod.network || '').trim(),
        wallet_address: editingMethod.wallet_address.trim(),
        instructions: (editingMethod.instructions || '').trim(),
        min_amount: Number(editingMethod.min_amount) || 0,
        active: editingMethod.active !== false,
        sort_order: Number(editingMethod.sort_order) || methods.length + 1,
      })
      showToast(editingMethod.id ? 'Deposit method updated' : 'Deposit method added')
      setEditingMethod(null)
      await loadMethods()
    } catch (err) {
      showToast(err?.message || 'Could not save the deposit method')
    }
    setMethodSaving(false)
  }

  const removeMethod = async (m) => {
    if (!window.confirm(`Delete "${m.name}"? Investors will no longer be able to deposit with it.`)) return
    setMethodBusy(m.id)
    try {
      await deleteDepositMethod(m.id)
      showToast('Deposit method deleted')
      await loadMethods()
    } catch (err) {
      showToast(err?.message || 'Could not delete the deposit method')
    }
    setMethodBusy(null)
  }

  const copyAddress = async (addr) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopiedAddr(addr)
      setTimeout(() => setCopiedAddr(''), 2000)
    } catch {
      showToast('Could not copy — select the address and copy manually')
    }
  }

  const loadAll = useCallback(async () => {
    if (!isAdmin) return
    setListLoading(true)
    try {
      const [usersRes, depRes, wdRes, plansRes, invRes, msgRes] = await Promise.all([
        db.auth.listUsers({ limit: 100 }),
        db.listDocuments('lumen_deposits', { sort: 'created_at', order: 'desc', limit: 100 }).catch(() => []),
        db.listDocuments('lumen_withdrawals', { sort: 'created_at', order: 'desc', limit: 100 }).catch(() => []),
        db.listDocuments('lumen_plans', { sort: 'sort_order', order: 'asc', limit: 20 }).catch(() => []),
        db.listDocuments('lumen_investments', { limit: 200 }).catch(() => []),
        db.listDocuments('lumen_messages', { sort: 'created_at', order: 'desc', limit: 200 }).catch(() => []),
      ])
      // listUsers returns { data: [...] }; listDocuments returns a plain array
      const rows = (r) => (Array.isArray(r) ? r : (r?.data ?? []))
      setUsers(rows(usersRes))
      setDeposits(rows(depRes))
      setWithdrawals(rows(wdRes))
      setPlans(rows(plansRes))
      setInvestments(rows(invRes))
      setMessages(rows(msgRes))
    } catch {}
    setListLoading(false)
  }, [isAdmin])

  const savePlan = async () => {
    if (!editingPlan) return
    if (!editingPlan.name?.trim()) { showToast('Plan name is required'); return }
    setPlanSaving(true)
    try {
      const { id, ...fields } = editingPlan
      // Normalize numeric fields
      const data = {
        name: fields.name,
        slug: fields.slug || fields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        annual_return_pct: Number(fields.annual_return_pct) || 0,
        min_usd: Number(fields.min_usd) || 0,
        max_usd: Number(fields.max_usd) || 0,
        risk: fields.risk || '',
        assets: fields.assets || '',
        strategy: fields.strategy || '',
        perks: Array.isArray(fields.perks) ? fields.perks : [],
        featured: !!fields.featured,
        active: fields.active !== false,
        sort_order: Number(fields.sort_order) || (plans.length + 1),
      }
      if (id) {
        // updateDocument sends the 3rd arg as the PATCH body; the API wraps it in `data`.
        await db.updateDocument('lumen_plans', id, data)
        showToast('Plan updated')
      } else {
        await db.createDocument('lumen_plans', data)
        showToast('Plan created')
      }
      setEditingPlan(null)
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Failed to save plan')
    }
    setPlanSaving(false)
  }

  const newPlan = () => setEditingPlan({
    name: '', annual_return_pct: 0, min_usd: 5000, max_usd: 0,
    risk: 'Medium', assets: '', strategy: '', perks: [], featured: false, active: true,
    sort_order: plans.length + 1,
  })

  const openManager = (u) => {
    setManaging(u)
    setFundAmount('')
    const firstPlan = (plans[0]?.id) || ''
    setFundPlanId(firstPlan)
  }

  const handleFund = async () => {
    if (!managing) return
    const amt = parseFloat(String(fundAmount).replace(/,/g, ''))
    if (!amt || amt <= 0) { showToast('Enter a valid amount'); return }
    if (!fundPlanId) { showToast('Select a plan'); return }
    setFundBusy(true)
    try {
      const res = await db.functions.execute('admin_fund', {
        payload: {
          action: 'fund',
          user_id: managing.id,
          user_email: managing.email,
          user_name: displayName(managing),
          amount: amt,
          plan_id: fundPlanId,
        },
        method: 'POST',
      })
      const r = res?.result ?? res
      if (r?.error) throw new Error(r.error)
      showToast(`Funded ${displayName(managing)} $${fmt(amt)}`)
      setFundAmount('')
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Funding failed')
    }
    setFundBusy(false)
  }

  const handleDefund = async (investmentId) => {
    setFundBusy(true)
    try {
      const res = await db.functions.execute('admin_fund', {
        payload: { action: 'defund', investment_id: investmentId },
        method: 'POST',
      })
      const r = res?.result ?? res
      if (r?.error) throw new Error(r.error)
      showToast('Investment closed')
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Defund failed')
    }
    setFundBusy(false)
  }

  const openMessage = (m) => {
    setActiveMsg(m)
    setReplyBody('')
  }

  const handleReply = async () => {
    if (!activeMsg) return
    const to = activeMsg.data?.email
    if (!to) { showToast('This message has no reply-to email'); return }
    if (!replyBody.trim()) { showToast('Write a reply first'); return }
    setReplyBusy(true)
    try {
      const res = await db.functions.execute('support_email', {
        payload: {
          action: 'reply',
          message_id: activeMsg.id,
          to_email: to,
          subject: activeMsg.data?.subject ? `Re: ${activeMsg.data.subject}` : 'Re: your message',
          body: replyBody,
        },
        method: 'POST',
      })
      const r = res?.result ?? res
      if (r?.error) throw new Error(r.error)
      showToast(`Reply sent to ${to}`)
      setReplyBody('')
      setActiveMsg(null)
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Failed to send reply')
    }
    setReplyBusy(false)
  }

  const handleCompose = async () => {
    const to = compose.to.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { showToast('Enter a valid recipient email'); return }
    if (!compose.subject.trim()) { showToast('Enter a subject'); return }
    if (!compose.body.trim()) { showToast('Write a message'); return }
    setComposeBusy(true)
    try {
      const res = await db.functions.execute('support_email', {
        payload: { action: 'send', to_email: to, subject: compose.subject, body: compose.body },
        method: 'POST',
      })
      const r = res?.result ?? res
      if (r?.error) throw new Error(r.error)
      showToast(`Email sent to ${to}`)
      setCompose({ to: '', subject: '', body: '' })
      setComposing(false)
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Failed to send email')
    }
    setComposeBusy(false)
  }

  const handleDeleteMessage = async (msg) => {
    if (!msg) return
    const label = msg.data?.subject || msg.data?.email || 'this message'
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return
    setDeleteBusy(true)
    try {
      await db.deleteDocument('lumen_messages', msg.id)
      setActiveMsg(null)
      showToast('Message deleted')
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Failed to delete message')
    }
    setDeleteBusy(false)
  }

  const handleClearMessages = async () => {
    if (messages.length === 0) return
    if (!window.confirm(`Delete all ${messages.length} message${messages.length === 1 ? '' : 's'}? This cannot be undone.`)) return
    setDeleteBusy(true)
    try {
      await db.deleteDocuments('lumen_messages', messages.map((m) => m.id))
      setActiveMsg(null)
      showToast('Inbox cleared')
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Failed to clear inbox')
    }
    setDeleteBusy(false)
  }

  const unreadMessages = messages.filter((m) => (m.data?.status || 'new') === 'new').length

  // Active investments for the investor currently being managed
  const managingInvestments = managing
    ? investments.filter((i) => i.data?.user_id === managing.id && i.data?.status === 'active')
    : []

  useEffect(() => {
    if (!loading && isAdmin) { loadAll(); loadMethods() }
  }, [loading, isAdmin, loadAll, loadMethods])

  const handleAction = async (type, recordId, action, note = '') => {
    // Approving a withdrawal only marks it paid — send the funds by hand first.
    if (type === 'withdrawal' && action === 'approve') {
      const d = withdrawals.find((w) => w.id === recordId)?.data || {}
      const ok = window.confirm(
        `Confirm you have already sent $${parseFloat(d.amount || 0).toLocaleString()} to:\n\n${d.bank_details || '(no address on file)'}\n\nApproving only records the payout — it does not move any funds.`
      )
      if (!ok) return
    }
    setActionLoading(recordId)
    try {
      await db.functions.execute('admin_action', {
        payload: { type, record_id: recordId, action, note },
        method: 'POST',
      })
      showToast(`Request ${action}d successfully`)
      await loadAll()
    } catch (err) {
      showToast(err?.message || 'Action failed')
    }
    setActionLoading(null)
  }

  const handleSignOut = async () => { try { await db.auth.logout() } catch {} navigate('/login') }

  if (loading) return <BrandSplash label="Verifying admin access" />

  if (!isAuthenticated) return (
    <Centered><AuthBlock title="Sign in required" sub="You need to be signed in to access the admin console." action={<Link to="/login" style={btnStyle()}>Go to sign in</Link>} /></Centered>
  )

  if (!isAdmin) return (
    <Centered><AuthBlock title="Admins only" sub={`Your account (${user?.email}) does not have the admin role.`} action={<Link to="/dashboard" style={btnStyle()}>Back to my dashboard</Link>} /></Centered>
  )

  const pending = { deposits: deposits.filter(d => d.data?.status === 'pending'), withdrawals: withdrawals.filter(w => w.data?.status === 'pending') }
  const activeInvestments = investments.filter(i => i.data?.status === 'active')
  const totalAUM = activeInvestments.reduce((s, i) => s + Number(i.data?.principal || 0), 0)
  const totalEarnings = activeInvestments.reduce((s, i) => s + accrued(Number(i.data?.principal || 0), Number(i.data?.annual_return_pct || 0), i.data?.start_date), 0)
  const adminCount = users.filter(u => (u.roles || []).includes('admin')).length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: C.ink, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 20px 50px rgba(0,0,0,.3)', animation: 'paneIn .25s ease' }}>{toast}</div>
      )}

      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px clamp(18px,4vw,52px)', borderBottom: `1px solid ${C.border}`, background: C.surface, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/uploads/kneelstone-logo.png" alt="Keelstone Trust" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{ fontFamily: serif, fontSize: 19, color: C.ink }}>Keelstone Trust</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.primary, background: 'rgba(109,40,217,.1)', padding: '3px 8px', borderRadius: 4 }}>Admin</span>
        </div>

        {/* NAV */}
        <nav style={{ display: 'flex', gap: 2, marginLeft: 16, background: C.bg, padding: 3, borderRadius: 6, border: `1px solid ${C.border}` }}>
          {NAV.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setScreen(k)}
              style={{ padding: '7px 13px', borderRadius: 4, border: 'none', background: screen === k ? C.surface : 'transparent', color: screen === k ? C.primary : C.body, fontSize: 13, fontWeight: screen === k ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: screen === k ? '0 1px 4px rgba(109,40,217,.08)' : 'none', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {l}{k === 'deposits' && pending.deposits.length > 0 ? ` (${pending.deposits.length})` : ''}{k === 'withdrawals' && pending.withdrawals.length > 0 ? ` (${pending.withdrawals.length})` : ''}{k === 'messages' && unreadMessages > 0 ? ` (${unreadMessages})` : ''}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar u={user} size={34} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>{displayName(user)}</span>
        </div>
        <Link to="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none', padding: '7px 13px', borderRadius: 6, border: `1px solid ${C.border}` }}>Client view</Link>
        <button type="button" onClick={handleSignOut} style={{ padding: '7px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
      </header>

      <main style={{ flex: 1, maxWidth: 1160, margin: '0 auto', width: '100%', padding: '32px clamp(18px,4vw,52px) 60px' }}>

        {/* ── OVERVIEW ── */}
        {screen === 'overview' && (
          <section>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 800, marginBottom: 8 }}>Admin console</div>
              <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 38, margin: '0 0 6px', color: C.ink }}>Platform overview</h1>
              <p style={{ fontSize: 14.5, color: C.muted, margin: 0 }}>Real-time snapshot of the Keelstone Trust investment platform.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 26 }}>
              {[
                { label: 'Assets under management', val: listLoading ? '—' : `$${fmt(totalAUM)}`, sub: `${activeInvestments.length} active investments`, color: C.green },
                { label: 'Investor earnings accrued', val: listLoading ? '—' : `$${fmt(totalEarnings)}`, sub: 'Paid out over time', color: C.primary },
                { label: 'Pending deposits', val: listLoading ? '—' : pending.deposits.length, sub: 'Awaiting approval', color: C.amber },
                { label: 'Pending withdrawals', val: listLoading ? '—' : pending.withdrawals.length, sub: 'Awaiting processing', color: C.pink },
              ].map((s) => (
                <div key={s.label} style={card(22)}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 10 }}>{s.label}</div>
                  <div style={{ fontFamily: serif, fontSize: 32, color: s.color, marginBottom: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Deposit methods at a glance */}
            <div style={{ ...card(24), marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Deposit methods</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>The wallets investors are told to send funds to.</div>
                </div>
                <button type="button" onClick={() => setScreen('methods')}
                  style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Manage →
                </button>
              </div>

              {methods.length === 0 ? (
                <div style={{ display: 'flex', gap: 10, background: 'rgba(243,186,47,.08)', border: '1px solid rgba(243,186,47,.3)', borderRadius: 12, padding: '13px 16px', fontSize: 13.5, color: '#8a6d1f', lineHeight: 1.55 }}>
                  <span style={{ flex: 'none' }}>⚠️</span>
                  <span>No deposit methods yet — <b>investors cannot deposit</b> until you add at least one. Go to <b>Deposit Methods</b> and add a wallet.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  {methods.map((m) => (
                    <div key={m.id} style={{ background: '#f8f5ff', borderRadius: 14, padding: '14px 16px', opacity: m.active ? 1 : 0.55 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{m.name}</span>
                        {m.symbol && <span style={{ fontSize: 10.5, fontWeight: 800, color: C.primary }}>{m.symbol}</span>}
                        {!m.active && <span style={{ fontSize: 10, fontWeight: 800, color: C.red, textTransform: 'uppercase' }}>Hidden</span>}
                      </div>
                      {m.network && <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>{m.network}</div>}
                      <div style={{ fontSize: 11, color: C.body, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{m.wallet_address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action tables */}
            {pending.deposits.length > 0 && (
              <div style={{ ...card(0), marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Pending deposits</div>
                  <button type="button" onClick={() => setScreen('deposits')} style={{ border: 'none', background: 'transparent', color: C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
                </div>
                <RequestRows items={pending.deposits} type="deposit" actionLoading={actionLoading} onAction={handleAction} actionNote={actionNote} setActionNote={setActionNote} />
              </div>
            )}

            {pending.withdrawals.length > 0 && (
              <div style={card(0)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Pending withdrawals</div>
                  <button type="button" onClick={() => setScreen('withdrawals')} style={{ border: 'none', background: 'transparent', color: C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
                </div>
                <RequestRows items={pending.withdrawals} type="withdrawal" actionLoading={actionLoading} onAction={handleAction} actionNote={actionNote} setActionNote={setActionNote} />
              </div>
            )}

            {pending.deposits.length === 0 && pending.withdrawals.length === 0 && !listLoading && (
              <div style={{ ...card(32), textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 6 }}>All clear</div>
                <div style={{ fontSize: 14, color: C.muted }}>No pending deposits or withdrawals. Check back later.</div>
              </div>
            )}
          </section>
        )}

        {/* ── INVESTORS ── */}
        {screen === 'investors' && (
          <section>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Investor management</h1>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{listLoading ? 'Loading…' : `${users.length} total accounts`}</p>
            </div>
            <div style={card(0)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 0.8fr 1fr 1fr 1fr', gap: 14, padding: '14px 22px', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                <div>Investor</div><div>Email</div><div>Plans</div><div style={{ textAlign: 'right' }}>Invested</div><div style={{ textAlign: 'right' }}>Earnings</div><div style={{ textAlign: 'right' }}>Manage</div>
              </div>
              {listLoading ? <LoadingRow /> : users.map((u) => {
                const t = investorTotals(u.id, investments)
                const isAdminUser = (u.roles || []).includes('admin')
                return (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 0.8fr 1fr 1fr 1fr', gap: 14, alignItems: 'center', padding: '15px 22px', borderBottom: `1px solid #f6f1fe` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <Avatar u={u} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName(u)}</div>
                        {isAdminUser && <span style={{ fontSize: 10.5, fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '.06em' }}>Admin</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.count ? C.ink : C.muted }}>{t.count || '—'}</div>
                    <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: C.ink }}>{t.principal ? `$${fmt(t.principal)}` : '—'}</div>
                    <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: t.earnings ? C.green : C.muted }}>{t.earnings ? `+$${fmt(t.earnings)}` : '—'}</div>
                    <div style={{ textAlign: 'right' }}>
                      <button type="button" onClick={() => openManager(u)} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Manage</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── DEPOSITS ── */}
        {screen === 'deposits' && (
          <section>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Deposit requests</h1>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{listLoading ? 'Loading…' : `${deposits.length} total · ${pending.deposits.length} pending`}</p>
            </div>
            {listLoading ? <div style={card(32)}><LoadingRow /></div> : deposits.length === 0 ? (
              <div style={{ ...card(32), textAlign: 'center', color: C.muted }}>No deposit requests yet.</div>
            ) : (
              <div style={card(0)}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 1.6fr', gap: 14, padding: '14px 22px', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                  <div>Investor</div><div>Amount</div><div>Method</div><div>Status</div><div>Actions</div>
                </div>
                <RequestRows items={deposits} type="deposit" actionLoading={actionLoading} onAction={handleAction} actionNote={actionNote} setActionNote={setActionNote} showAll />
              </div>
            )}
          </section>
        )}

        {/* ── DEPOSIT METHODS ── */}
        {screen === 'methods' && (
          <section>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Deposit methods</h1>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>The wallets investors send funds to. Anything active here appears in their deposit screen immediately.</p>
              </div>
              <button type="button" onClick={() => setEditingMethod({ ...BLANK_METHOD, sort_order: methods.length + 1 })}
                style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6d28d9,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                + Add method
              </button>
            </div>

            {methods.length === 0 ? (
              <div style={{ ...card(36), textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 6 }}>No deposit methods yet</div>
                <div style={{ fontSize: 14, color: C.muted, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Investors can't deposit until you add at least one. Add the coin or currency name and the wallet address they should send to.
                </div>
                <button type="button" onClick={() => setEditingMethod({ ...BLANK_METHOD, sort_order: 1 })}
                  style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Add your first method
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {methods.map((m) => (
                  <div key={m.id} style={{ ...card(20), opacity: m.active ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: serif, fontSize: 20, color: C.ink }}>{m.name}</span>
                          {m.symbol && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(109,40,217,.1)', color: C.primary, letterSpacing: '.06em' }}>{m.symbol}</span>}
                          {!m.active && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#fef2f2', color: C.red, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hidden</span>}
                        </div>
                        {m.network && <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 8 }}>Network: <b style={{ color: C.body }}>{m.network}</b>{m.min_amount > 0 && <> · Min ${Number(m.min_amount).toLocaleString()}</>}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', marginBottom: m.instructions ? 10 : 0 }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.body, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{m.wallet_address}</span>
                          <button type="button" onClick={() => copyAddress(m.wallet_address)}
                            style={{ flex: 'none', padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: copiedAddr === m.wallet_address ? C.green : C.primary, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {copiedAddr === m.wallet_address ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        {m.instructions && <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>{m.instructions}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                        <button type="button" onClick={() => setEditingMethod({ ...m })}
                          style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeMethod(m)} disabled={methodBusy === m.id}
                          style={{ padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fef2f2', color: C.red, fontSize: 13.5, fontWeight: 700, cursor: methodBusy === m.id ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {methodBusy === m.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── WITHDRAWALS ── */}
        {screen === 'withdrawals' && (
          <section>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Withdrawal requests</h1>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{listLoading ? 'Loading…' : `${withdrawals.length} total · ${pending.withdrawals.length} pending`}</p>
            </div>
            {listLoading ? <div style={card(32)}><LoadingRow /></div> : withdrawals.length === 0 ? (
              <div style={{ ...card(32), textAlign: 'center', color: C.muted }}>No withdrawal requests yet.</div>
            ) : (
              <div style={card(0)}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 1.6fr', gap: 14, padding: '14px 22px', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                  <div>Investor</div><div>Amount</div><div>Bank ref</div><div>Status</div><div>Actions</div>
                </div>
                <RequestRows items={withdrawals} type="withdrawal" actionLoading={actionLoading} onAction={handleAction} actionNote={actionNote} setActionNote={setActionNote} showAll />
              </div>
            )}
          </section>
        )}

        {/* ── PLANS ── */}
        {screen === 'plans' && (
          <section>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Investment plans</h1>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Edit plans shown on the public website. Changes go live immediately.</p>
              </div>
              <button type="button" onClick={newPlan}
                style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6d28d9,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                + Add plan
              </button>
            </div>

            {editingPlan && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div onClick={() => setEditingPlan(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,22,.55)', backdropFilter: 'blur(6px)' }} />
                <div style={{ position: 'relative', zIndex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
                  <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 20 }}>{editingPlan.id ? `Edit — ${editingPlan.name}` : 'New investment plan'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { key: 'name', label: 'Plan name', type: 'text' },
                      { key: 'annual_return_pct', label: 'Target annual return (%)', type: 'number' },
                      { key: 'min_usd', label: 'Minimum investment (USD)', type: 'number' },
                      { key: 'max_usd', label: 'Maximum investment (0 = no limit)', type: 'number' },
                      { key: 'risk', label: 'Risk level', type: 'text' },
                      { key: 'assets', label: 'Assets / allocation', type: 'text' },
                      { key: 'strategy', label: 'Strategy description', type: 'text' },
                    ].map(({ key, label, type }) => (
                      <label key={key} style={{ display: 'block' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                        <input
                          type={type} value={editingPlan[key] ?? ''}
                          onChange={(e) => setEditingPlan((p) => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff' }}
                        />
                      </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.body, cursor: 'pointer', marginTop: 4 }}>
                      <input type="checkbox" checked={!!editingPlan.featured} onChange={(e) => setEditingPlan((p) => ({ ...p, featured: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer' }} />
                      Mark as featured (highlighted on website)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.body, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!editingPlan.active} onChange={(e) => setEditingPlan((p) => ({ ...p, active: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer' }} />
                      Plan is active (shown on website)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button type="button" onClick={savePlan} disabled={planSaving}
                      style={{ flex: 1, padding: '12px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: planSaving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: planSaving ? 0.7 : 1 }}>
                      {planSaving ? 'Saving…' : editingPlan.id ? 'Save changes' : 'Create plan'}
                    </button>
                    <button type="button" onClick={() => setEditingPlan(null)}
                      style={{ padding: '12px 20px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.body, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {listLoading ? <div style={{ ...card(24), textAlign: 'center', color: C.muted }}>Loading…</div> : plans.map((p) => {
                const d = p.data || {}
                return (
                  <div key={p.id} style={{ ...card(20), display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: serif, fontSize: 20, color: C.ink }}>{d.name}</span>
                        {d.featured && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(109,40,217,.1)', color: C.primary, textTransform: 'uppercase', letterSpacing: '.06em' }}>Featured</span>}
                        {!d.active && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#fef2f2', color: C.red, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hidden</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.muted }}>
                        Min: <b style={{ color: C.ink }}>${(d.min_usd || 0).toLocaleString()}</b>
                        {d.max_usd > 0 && <> · Max: <b style={{ color: C.ink }}>${d.max_usd.toLocaleString()}</b></>}
                        {d.annual_return_pct > 0 && <> · Target return: <b style={{ color: '#16a34a' }}>{d.annual_return_pct}% p.a.</b></>}
                        {' · '}{d.risk} risk · {d.assets}
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditingPlan({ id: p.id, ...d })}
                      style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      Edit plan →
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── PORTFOLIO MGMT ── */}
        {screen === 'portfolio' && (
          <section>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Portfolio management</h1>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Strategy allocations, rebalancing and performance overview.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 24 }}>
              {[
                { name: 'Growth Strategy', alloc: '$120,000', ret: '+22%', risk: 'High', assets: 'BTC 70% · ETH 30%', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#f97316)' },
                { name: 'Balanced Strategy', alloc: '$100,000', ret: '+15%', risk: 'Medium', assets: 'BTC 40% · ETH 35% · Stable 25%', color: C.primary, grad: 'linear-gradient(135deg,#6d28d9,#a855f7)' },
                { name: 'Conservative Strategy', alloc: '$52,000', ret: '+9%', risk: 'Low', assets: 'Stable yield 75% · Crypto 25%', color: '#2563eb', grad: 'linear-gradient(135deg,#2563eb,#06b6d4)' },
              ].map((s) => (
                <div key={s.name} style={card(22)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, flex: 'none' }}>▲</div>
                    <div style={{ fontFamily: serif, fontSize: 18, color: C.ink }}>{s.name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[['Allocated', s.alloc], ['Annual return', s.ret], ['Risk level', s.risk], ['Assets', s.assets]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: C.muted, fontWeight: 600 }}>{k}</span>
                        <span style={{ color: k === 'Annual return' ? C.green : C.ink, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" style={{ marginTop: 18, width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: s.color, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Manage strategy →</button>
                </div>
              ))}
            </div>

            <div style={card(24)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Platform performance summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                {[
                  ['Total AUM', `$${fmt(totalAUM)}`],
                  ['Portfolio value', `$${fmt(totalAUM + totalEarnings)}`],
                  ['Earnings accrued', `$${fmt(totalEarnings)}`],
                  ['Active investments', String(activeInvestments.length)],
                  ['Active investors', String(new Set(activeInvestments.map(i => i.data?.user_id)).size)],
                  ['Plans offered', String(plans.length)],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#f8f5ff', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                    <div style={{ fontFamily: serif, fontSize: 22, color: C.ink }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── MESSAGES / SUPPORT INBOX ── */}
        {screen === 'messages' && (
          <section>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: C.ink }}>Support inbox</h1>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{listLoading ? 'Loading…' : `${messages.length} message${messages.length === 1 ? '' : 's'} · ${unreadMessages} new`}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {messages.length > 0 && (
                  <button type="button" onClick={handleClearMessages} disabled={deleteBusy}
                    style={{ padding: '11px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.red, fontSize: 14, fontWeight: 700, cursor: deleteBusy ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: deleteBusy ? 0.6 : 1 }}>
                    {deleteBusy ? 'Clearing…' : 'Clear all'}
                  </button>
                )}
                <button type="button" onClick={() => { setCompose({ to: '', subject: '', body: '' }); setComposing(true) }}
                  style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6d28d9,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  ✉ Compose email
                </button>
              </div>
            </div>

            {listLoading ? (
              <div style={card(32)}><LoadingRow /></div>
            ) : messages.length === 0 ? (
              <div style={{ ...card(32), textAlign: 'center' }}>
                <div style={{ fontSize: 34, marginBottom: 12 }}>📭</div>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 6 }}>No messages yet</div>
                <div style={{ fontSize: 14, color: C.muted, maxWidth: 460, margin: '0 auto' }}>Emails sent to your support address will appear here once inbound email is configured. You can still compose and send emails to any investor now.</div>
              </div>
            ) : (
              <div style={card(0)}>
                {messages.map((m) => {
                  const d = m.data || {}
                  const isNew = (d.status || 'new') === 'new'
                  const outbound = d.direction === 'outbound'
                  return (
                    <button key={m.id} type="button" onClick={() => openMessage(m)}
                      style={{ width: '100%', textAlign: 'left', display: 'grid', gridTemplateColumns: '1.6fr 2.4fr 0.9fr', gap: 14, alignItems: 'center', padding: '15px 22px', borderBottom: '1px solid #f6f1fe', background: 'transparent', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {isNew && !outbound && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, flex: 'none' }} />}
                          <span style={{ fontSize: 14, fontWeight: isNew && !outbound ? 800 : 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{outbound ? `To: ${d.name || d.email}` : (d.name || d.email || 'Unknown')}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.email}</div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.body, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subject || '(no subject)'}</div>
                        <div style={{ fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.message || ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: outbound ? '#eef2ff' : isNew ? 'rgba(109,40,217,.1)' : '#f0fdf4', color: outbound ? '#4338ca' : isNew ? C.primary : C.green }}>
                          {outbound ? 'Sent' : isNew ? 'New' : 'Replied'}
                        </span>
                        <span style={{ fontSize: 11, color: C.muted }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

      </main>

      {/* ── ADD / EDIT DEPOSIT METHOD ── */}
      {editingMethod && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setEditingMethod(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,22,.55)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 20 }}>
              {editingMethod.id ? `Edit — ${editingMethod.name}` : 'New deposit method'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'name', label: 'Name', placeholder: 'Bitcoin', type: 'text' },
                { key: 'symbol', label: 'Symbol', placeholder: 'BTC', type: 'text' },
                { key: 'network', label: 'Network / chain', placeholder: 'Bitcoin mainnet', type: 'text' },
                { key: 'wallet_address', label: 'Wallet address', placeholder: 'bc1q…', type: 'text', mono: true },
                { key: 'min_amount', label: 'Minimum deposit (0 = none)', placeholder: '0', type: 'number' },
              ].map(({ key, label, placeholder, type, mono }) => (
                <label key={key} style={{ display: 'block' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                  <input
                    type={type} value={editingMethod[key] ?? ''} placeholder={placeholder}
                    onChange={(e) => setEditingMethod((m) => ({ ...m, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: mono ? 13 : 14, fontFamily: mono ? 'monospace' : 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', boxSizing: 'border-box' }}
                  />
                </label>
              ))}
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>Instructions for the investor</div>
                <textarea
                  value={editingMethod.instructions ?? ''} rows={3}
                  placeholder="e.g. Send only BTC on the Bitcoin network. Deposits confirm after 3 blocks."
                  onChange={(e) => setEditingMethod((m) => ({ ...m, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.body, cursor: 'pointer' }}>
                <input type="checkbox" checked={editingMethod.active !== false} onChange={(e) => setEditingMethod((m) => ({ ...m, active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer' }} />
                Active (investors can deposit with this method)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button type="button" onClick={saveMethod} disabled={methodSaving}
                style={{ flex: 1, padding: '12px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: methodSaving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: methodSaving ? 0.7 : 1 }}>
                {methodSaving ? 'Saving…' : editingMethod.id ? 'Save changes' : 'Add method'}
              </button>
              <button type="button" onClick={() => setEditingMethod(null)}
                style={{ padding: '12px 20px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.body, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FUND / DEFUND MANAGER ── */}
      {managing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setManaging(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,22,.55)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Avatar u={managing} size={44} />
              <div>
                <div style={{ fontFamily: serif, fontSize: 20, color: C.ink }}>{displayName(managing)}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{managing.email}</div>
              </div>
            </div>

            {/* Current balance */}
            {(() => {
              const t = investorTotals(managing.id, investments)
              return (
                <div style={{ display: 'flex', gap: 10, margin: '18px 0 22px' }}>
                  {[['Invested', `$${fmt(t.principal)}`, C.ink], ['Earnings', `+$${fmt(t.earnings)}`, C.green], ['Value', `$${fmt(t.value)}`, C.ink]].map(([k, v, col]) => (
                    <div key={k} style={{ flex: 1, background: C.bg, borderRadius: 6, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontFamily: serif, fontSize: 19, color: col }}>{v}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Fund */}
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Add funds</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <select value={fundPlanId} onChange={(e) => setFundPlanId(e.target.value)}
                style={{ flex: '1 1 160px', padding: '11px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#faf7ff', color: C.ink, outline: 'none' }}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.data?.name} ({p.data?.annual_return_pct}% p.a.)</option>
                ))}
              </select>
              <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 12px', background: '#faf7ff' }}>
                <span style={{ fontSize: 15, color: C.muted }}>$</span>
                <input value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="Amount"
                  style={{ width: '100%', padding: '11px 6px', border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', color: C.ink, outline: 'none' }} />
              </div>
            </div>
            <button type="button" onClick={handleFund} disabled={fundBusy}
              style={{ width: '100%', padding: '12px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: fundBusy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: fundBusy ? 0.7 : 1, marginBottom: 24 }}>
              {fundBusy ? 'Working…' : '+ Fund investor'}
            </button>

            {/* Defund — active investments */}
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Active investments</div>
            {managingInvestments.length === 0 ? (
              <div style={{ fontSize: 13.5, color: C.muted, padding: '8px 0 4px' }}>No active investments.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {managingInvestments.map((inv) => {
                  const d = inv.data || {}
                  return (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{d.plan_name} · ${fmt(d.principal)}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{d.annual_return_pct}% p.a. · since {d.start_date ? new Date(d.start_date).toLocaleDateString() : '—'}</div>
                      </div>
                      <button type="button" onClick={() => handleDefund(inv.id)} disabled={fundBusy}
                        style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: '#fef2f2', color: C.red, fontSize: 12.5, fontWeight: 700, cursor: fundBusy ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Defund
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <button type="button" onClick={() => setManaging(null)} style={{ width: '100%', marginTop: 22, padding: 12, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* ── MESSAGE DETAIL + REPLY ── */}
      {activeMsg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setActiveMsg(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,22,.55)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{activeMsg.data?.direction === 'outbound' ? 'To' : 'From'}</div>
            <div style={{ fontFamily: serif, fontSize: 20, color: C.ink }}>{activeMsg.data?.name || activeMsg.data?.email || 'Unknown'}</div>
            <div style={{ fontSize: 13, color: C.primary, marginBottom: 16 }}>{activeMsg.data?.email}</div>

            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Subject</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14 }}>{activeMsg.data?.subject || '(no subject)'}</div>

            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.65, whiteSpace: 'pre-wrap', background: C.bg, borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>{activeMsg.data?.message || '—'}</div>

            {activeMsg.data?.reply_body && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Your reply{activeMsg.data?.replied_by ? ` · ${activeMsg.data.replied_by}` : ''}</div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.65, whiteSpace: 'pre-wrap', background: '#f0fdf4', borderRadius: 8, padding: '14px 16px' }}>{activeMsg.data.reply_body}</div>
              </div>
            )}

            {activeMsg.data?.direction !== 'outbound' && (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Reply via email</div>
                <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder={`Write your reply to ${activeMsg.data?.email || 'the sender'}…`} rows={6}
                  style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', resize: 'vertical', boxSizing: 'border-box' }} />
                <button type="button" onClick={handleReply} disabled={replyBusy}
                  style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: replyBusy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: replyBusy ? 0.7 : 1 }}>
                  {replyBusy ? 'Sending…' : 'Send reply'}
                </button>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => handleDeleteMessage(activeMsg)} disabled={deleteBusy}
                style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 14, fontWeight: 600, cursor: deleteBusy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
              <button type="button" onClick={() => setActiveMsg(null)} style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPOSE NEW EMAIL ── */}
      {composing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setComposing(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,22,.55)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, marginBottom: 20 }}>Compose email</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>To</div>
                <input type="email" value={compose.to} onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))} placeholder="investor@example.com"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', boxSizing: 'border-box' }} />
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>Subject</div>
                <input type="text" value={compose.subject} onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))} placeholder="Subject"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', boxSizing: 'border-box' }} />
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>Message</div>
                <textarea value={compose.body} onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))} placeholder="Write your message…" rows={7}
                  style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.ink, background: '#faf7ff', resize: 'vertical', boxSizing: 'border-box' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button type="button" onClick={handleCompose} disabled={composeBusy}
                style={{ flex: 1, padding: '12px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: composeBusy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: composeBusy ? 0.7 : 1 }}>
                {composeBusy ? 'Sending…' : 'Send email'}
              </button>
              <button type="button" onClick={() => setComposing(false)}
                style={{ padding: '12px 20px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.body, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestRows({ items, type, actionLoading, onAction, actionNote, setActionNote, showAll }) {
  const display = showAll ? items : items.slice(0, 5)
  return (
    <div>
      {display.map((item) => {
        const d = item.data || {}
        const isPending = d.status === 'pending'
        const isProcessing = actionLoading === item.id
        return (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 1.6fr', gap: 14, alignItems: 'center', padding: '15px 22px', borderBottom: '1px solid #f6f1fe' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#221a33', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.user_name || d.user_email || '—'}</div>
              <div style={{ fontSize: 12, color: '#a89cc4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.user_email}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#221a33' }}>${parseFloat(d.amount || 0).toLocaleString()}</div>
              {type === 'deposit' && (
                <div style={{ fontSize: 11, color: d.plan_name ? '#6d28d9' : '#a89cc4', fontWeight: 700, marginTop: 2 }}>
                  {d.plan_name || 'To balance'}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#5b5172', minWidth: 0 }}>
              {type === 'deposit' && <div style={{ fontWeight: 700, color: '#221a33', marginBottom: 2 }}>{d.method || '—'}</div>}
              {d.tx_hash ? (
                <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: '#6d28d9', fontWeight: 700, fontFamily: 'monospace', textDecoration: 'none' }}>
                  {d.tx_hash.slice(0, 8)}…{d.tx_hash.slice(-6)} ↗
                </a>
              ) : d.reference ? (
                <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{String(d.reference).slice(0, 22)}{String(d.reference).length > 22 ? '…' : ''}</span>
              ) : type === 'withdrawal' && d.bank_details ? (
                <a href={`https://bscscan.com/address/${d.bank_details}`} target="_blank" rel="noreferrer" style={{ color: '#5b5172', fontFamily: 'monospace', textDecoration: 'none', wordBreak: 'break-all' }}>
                  {String(d.bank_details).slice(0, 10)}…{String(d.bank_details).slice(-6)}
                </a>
              ) : type === 'deposit' ? (
                <span style={{ color: '#a89cc4' }}>No reference given</span>
              ) : (
                <span style={{ fontFamily: 'monospace' }}>{d.method || '—'}</span>
              )}
            </div>
            <div><StatusBadge status={d.status || 'pending'} /></div>
            <div>
              {isPending ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    placeholder="Note (optional)"
                    value={actionNote[item.id] || ''}
                    onChange={(e) => setActionNote((n) => ({ ...n, [item.id]: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #ece4fb', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#faf7ff', color: '#221a33' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={isProcessing} onClick={() => onAction(type, item.id, 'approve', actionNote[item.id] || '')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: isProcessing ? '#d1fae5' : '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: isProcessing ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                      {isProcessing ? '…' : '✓ Approve'}
                    </button>
                    <button type="button" disabled={isProcessing} onClick={() => onAction(type, item.id, 'reject', actionNote[item.id] || '')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: isProcessing ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: '#a89cc4' }}>{d.admin_note || 'No note'}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingRow() {
  return <div style={{ padding: '32px 22px', textAlign: 'center', color: '#a89cc4', fontSize: 14 }}>Loading…</div>
}

function AuthBlock({ title, sub, action }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ece4fb', borderRadius: 22, padding: 36, maxWidth: 420, textAlign: 'center' }}>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: '#221a33', marginBottom: 10 }}>{title}</div>
      <p style={{ color: '#a89cc4', fontSize: 14.5, margin: '0 0 24px', lineHeight: 1.6 }}>{sub}</p>
      {action}
    </div>
  )
}

function Centered({ children }) {
  return <div style={{ minHeight: '100vh', background: '#faf7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>{children}</div>
}

function btnStyle() {
  return { display: 'inline-block', padding: '13px 24px', borderRadius: 13, background: 'linear-gradient(135deg,#6d28d9,#c026d3)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 14px 30px rgba(109,40,217,.35)' }
}
