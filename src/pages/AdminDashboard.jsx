import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../dashboard/dashboard.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BrandSplash from '../components/BrandSplash'
import {
  loadAdminData, displayName, initialsOf, investorTotals,
  savePlan, sendEmail, deleteMessage, fundInvestor, closeInvestment,
  loadInvestorDetail, updateProfile, setKycStatus, updateRecord,
  deleteRecord, deleteInvestor, setRole,
} from '../lib/admin'
import { reviewRequest, listAllDepositMethods, saveDepositMethod, deleteDepositMethod } from '../lib/deposits'
import { listKycSubmissions, reviewKyc, getDocumentUrl, ID_TYPES } from '../lib/kyc'
import {
  fetchNotifications, markRead, markAllRead, unreadCount,
  subscribeToNotifications, KINDS, KIND_FILTERS,
} from '../lib/notifications'
import {
  serif, money0, timeAgo, shortDate,
  Card, Button, Pill, EmptyState, SkeletonCard,
  Sheet, SheetHeader, Field, fieldStyle, Alert, Segmented, Toast, Icon,
} from '../dashboard/ui'

const TABS = [
  ['overview', 'Overview', 'home'],
  ['alerts', 'Alerts', 'bell'],
  ['investors', 'Investors', 'users'],
  ['requests', 'Requests', 'activity'],
  ['kyc', 'KYC', 'shield'],
  ['plans', 'Plans', 'plans'],
  ['inbox', 'Inbox', 'mail'],
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, profile, loading, isAuthenticated, isAdmin } = useAuth()

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lumen-theme') || 'light' } catch { return 'light' }
  })
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ profiles: [], deposits: [], withdrawals: [], plans: [], investments: [], messages: [] })
  const [methods, setMethods] = useState([])
  const [kyc, setKyc] = useState([])
  const [notifications, setNotifications] = useState([])
  const [busy, setBusy] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3400) }

  useEffect(() => { try { localStorage.setItem('lumen-theme', theme) } catch {} }, [theme])

  const reload = useCallback(async () => {
    if (!isAdmin) return
    const [core, m, k, n] = await Promise.all([
      loadAdminData(),
      listAllDepositMethods().catch(() => []),
      listKycSubmissions().catch(() => []),
      fetchNotifications().catch(() => []),
    ])
    setData(core)
    setMethods(m)
    setKyc(k)
    setNotifications(n)
    setBusy(false)
  }, [isAdmin])

  useEffect(() => { if (!loading && isAdmin) reload() }, [loading, isAdmin, reload])

  // Live feed — new events arrive without a refresh.
  useEffect(() => {
    if (!isAdmin) return
    return subscribeToNotifications((n) => setNotifications((prev) => [n, ...prev]))
  }, [isAdmin])

  const pendingDeposits = data.deposits.filter((d) => d.status === 'pending')
  const pendingWithdrawals = data.withdrawals.filter((w) => w.status === 'pending')
  const pendingKyc = kyc.filter((k) => k.status === 'submitted')
  const newMessages = data.messages.filter((m) => m.direction === 'inbound' && m.status === 'new')
  const activeInvestments = data.investments.filter((i) => i.status === 'active')

  const totals = useMemo(() => ({
    aum: activeInvestments.reduce((s, i) => s + Number(i.principal || 0), 0),
    earnings: activeInvestments.reduce((s, i) => s + Number(i.earnings || 0), 0),
    investors: data.profiles.filter((p) => p.role === 'investor').length,
  }), [activeInvestments, data.profiles])

  const actionCount = pendingDeposits.length + pendingWithdrawals.length + pendingKyc.length

  if (loading) return <BrandSplash label="Verifying admin access" />
  if (!isAuthenticated) return <Gate title="Sign in required" body="You need to be signed in to open the admin console." to="/login" cta="Go to sign in" />
  if (!isAdmin) return <Gate title="Admins only" body={`${user?.email} doesn't have admin access.`} to="/dashboard" cta="Back to my dashboard" />

  const badges = {
    alerts: unreadCount(notifications),
    requests: pendingDeposits.length + pendingWithdrawals.length,
    kyc: pendingKyc.length,
    inbox: newMessages.length,
  }

  return (
    <div data-root data-theme={theme} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar tab={tab} setTab={setTab} badges={badges} profile={profile} navigate={navigate} />

      <main data-main style={{ flex: 1, marginLeft: 236, padding: '0 28px 40px', minWidth: 0, maxWidth: 1180 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '18px 0 14px', background: 'var(--bg)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Admin console</div>
            <h1 data-pagetitle style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: '2px 0 0' }}>
              {TABS.find(([k]) => k === tab)?.[1]}
            </h1>
          </div>
          <button
            type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        {busy ? (
          <div style={{ display: 'grid', gap: 14 }}><SkeletonCard rows={3} /><SkeletonCard rows={4} /></div>
        ) : (
          <>
            {tab === 'overview' && (
              <section data-pane>
                <Overview
                  totals={totals} actionCount={actionCount}
                  pendingDeposits={pendingDeposits} pendingWithdrawals={pendingWithdrawals}
                  pendingKyc={pendingKyc} notifications={notifications}
                  activeCount={activeInvestments.length} goTab={setTab}
                />
              </section>
            )}
            {tab === 'alerts' && (
              <section data-pane>
                <Alerts notifications={notifications} setNotifications={setNotifications} showToast={showToast} goTab={setTab} />
              </section>
            )}
            {tab === 'investors' && (
              <section data-pane>
                <Investors data={data} reload={reload} showToast={showToast} />
              </section>
            )}
            {tab === 'requests' && (
              <section data-pane>
                <Requests deposits={data.deposits} withdrawals={data.withdrawals} profiles={data.profiles} reload={reload} showToast={showToast} />
              </section>
            )}
            {tab === 'kyc' && (
              <section data-pane>
                <KycQueue kyc={kyc} profiles={data.profiles} reload={reload} showToast={showToast} />
              </section>
            )}
            {tab === 'plans' && (
              <section data-pane>
                <Plans plans={data.plans} methods={methods} reload={reload} showToast={showToast} />
              </section>
            )}
            {tab === 'inbox' && (
              <section data-pane>
                <Inbox messages={data.messages} reload={reload} showToast={showToast} />
              </section>
            )}
          </>
        )}
      </main>

      {/* Mobile: the five sections an admin actually works from */}
      <nav data-tabbar aria-label="Admin sections">
        {TABS.slice(0, 5).map(([key, label, icon]) => (
          <button
            key={key} type="button" onClick={() => setTab(key)}
            {...(tab === key ? { 'data-active': '' } : {})}
            aria-current={tab === key ? 'page' : undefined}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon name={icon} size={22} />
              {badges[key] > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--loss)', border: '1.5px solid var(--surface)' }} />
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>

      <Toast message={toast} />
    </div>
  )
}

function Gate({ title, body, to, cta }) {
  return (
    <div data-root style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 400, textAlign: 'center' }} pad={32}>
        <div style={{ fontFamily: serif, fontSize: 26, color: 'var(--text)', marginBottom: 10 }}>{title}</div>
        <p style={{ color: 'var(--text-3)', fontSize: 14.5, margin: '0 0 22px', lineHeight: 1.6 }}>{body}</p>
        <Link to={to} style={{ textDecoration: 'none' }}><Button full>{cta}</Button></Link>
      </Card>
    </div>
  )
}

function Sidebar({ tab, setTab, badges, profile, navigate }) {
  return (
    <aside
      data-sidebar
      style={{
        width: 236, flex: 'none', position: 'fixed', top: 0, left: 0, height: '100vh',
        background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 12px', zIndex: 50, overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px' }}>
        <img src="/uploads/kneelstone-logo.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: serif, fontSize: 15.5, lineHeight: 1.15 }}>Keelstone</div>
          <div style={{ fontSize: 9.5, color: 'var(--primary)', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Admin</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {TABS.map(([key, label, icon]) => {
          const active = tab === key
          const n = badges[key] || 0
          return (
            <button
              key={key} type="button" onClick={() => setTab(key)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
                borderRadius: 'var(--r)', border: 'none',
                background: active ? 'var(--primary-soft)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-2)',
                fontSize: 14, fontWeight: active ? 700 : 500,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <Icon name={icon} size={19} />
              <span style={{ flex: 1 }}>{label}</span>
              {n > 0 && (
                <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--loss)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {n > 99 ? '99+' : n}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 12px' }}>
          <div style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5 }}>
            {initialsOf(profile)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName(profile)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Administrator</div>
          </div>
        </div>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block', marginBottom: 6 }}>
          <Button variant="secondary" size="sm" full>Investor view</Button>
        </Link>
        <Button
          variant="ghost" size="sm" full
          onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
          style={{ color: 'var(--loss)' }}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}

/* ══ overview ════════════════════════════════════════════ */

function Overview({ totals, actionCount, pendingDeposits, pendingWithdrawals, pendingKyc, notifications, activeCount, goTab }) {
  const stats = [
    ['Assets under management', `$${money0(totals.aum)}`, `${activeCount} active investments`],
    ['Earnings accrued', `$${money0(totals.earnings)}`, 'Across all investors'],
    ['Investors', String(totals.investors), 'Registered accounts'],
    ['Needs action', String(actionCount), actionCount ? 'Waiting on you' : 'All clear'],
  ]

  return (
    <>
      <div data-statgrid style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {stats.map(([label, val, sub], i) => (
          <Card key={label} pad={16}>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: serif, fontSize: 24, color: i === 3 && actionCount ? 'var(--warn)' : 'var(--text)' }}>{val}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>
          </Card>
        ))}
      </div>

      {actionCount > 0 && (
        <Card style={{ marginTop: 14 }} pad={18}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Waiting for review</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Deposits', pendingDeposits.length, 'requests', 'down'],
              ['Withdrawals', pendingWithdrawals.length, 'requests', 'up'],
              ['KYC submissions', pendingKyc.length, 'kyc', 'shield'],
            ].filter(([, n]) => n > 0).map(([label, n, target, icon]) => (
              <button
                key={label} type="button" onClick={() => goTab(target)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'var(--warn-soft)', border: '1px solid var(--border)',
                }}
              >
                <Icon name={icon} size={19} style={{ color: 'var(--warn)' }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
                <Pill tone="warn">{n} pending</Pill>
                <Icon name="arrowRight" size={16} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 14 }} pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Latest activity</h2>
          <Button variant="ghost" size="sm" onClick={() => goTab('alerts')}>See all</Button>
        </div>
        {notifications.length === 0 ? (
          <EmptyState compact icon={<Icon name="bell" size={22} />} title="Nothing yet" body="Activity across the platform will appear here." />
        ) : notifications.slice(0, 6).map((n) => <NotificationRow key={n.id} n={n} />)}
      </Card>
    </>
  )
}

/* ══ alerts ══════════════════════════════════════════════ */

const TONE_FG = { gain: 'var(--gain)', warn: 'var(--warn)', loss: 'var(--loss)', info: 'var(--info)', brand: 'var(--primary)' }
const TONE_BG = { gain: 'var(--gain-soft)', warn: 'var(--warn-soft)', loss: 'var(--loss-soft)', info: 'var(--info-soft)', brand: 'var(--primary-soft)' }

function NotificationRow({ n, onClick }) {
  const kind = KINDS[n.kind] || KINDS.message
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 0', borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: TONE_BG[n.tone] || 'var(--surface-2)', color: TONE_FG[n.tone] || 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={kind.icon} size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flex: 'none' }} />}
          <span style={{ fontSize: 14, fontWeight: n.isRead ? 600 : 800, color: 'var(--text)' }}>{n.title}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {n.body}{n.actor ? ` · ${n.actor}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        {n.amount != null && <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>${money0(n.amount)}</div>}
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{timeAgo(n.at)}</div>
      </div>
    </div>
  )
}

function Alerts({ notifications, setNotifications, showToast, goTab }) {
  const [filter, setFilter] = useState('all')
  const shown = notifications.filter((n) => filter === 'all' || n.kind === filter)
  const unread = unreadCount(notifications)

  const readAll = async () => {
    try {
      await markAllRead(notifications)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      showToast('All caught up')
    } catch (e) {
      showToast(e.message || 'Could not update')
    }
  }

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await markRead(n.id)
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      } catch { /* non-fatal */ }
    }
    const dest = { deposit: 'requests', withdrawal: 'requests', kyc: 'kyc', message: 'inbox', user: 'investors', investment: 'investors' }[n.kind]
    if (dest) goTab(dest)
  }

  return (
    <Card pad={18}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>{unread > 0 ? `${unread} unread` : 'All caught up'}</div>
        {unread > 0 && <Button variant="ghost" size="sm" onClick={readAll}>Mark all read</Button>}
      </div>

      <Segmented tabs={KIND_FILTERS} active={filter} onChange={setFilter} style={{ marginBottom: 8 }} />

      {shown.length === 0 ? (
        <EmptyState compact icon={<Icon name="bell" size={22} />} title="Nothing here" body="New activity will show up as it happens." />
      ) : shown.map((n) => <NotificationRow key={n.id} n={n} onClick={() => open(n)} />)}
    </Card>
  )
}

/* ══ investors ═══════════════════════════════════════════ */

function Investors({ data, reload, showToast }) {
  const [q, setQ] = useState('')
  const [managing, setManaging] = useState(null)

  const investors = data.profiles.filter((p) => {
    if (!q) return true
    const s = q.toLowerCase()
    return displayName(p).toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s)
  })

  return (
    <>
      <Card pad={14} style={{ marginBottom: 12 }}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search investors"
          style={{ ...fieldStyle }}
        />
      </Card>

      <Card pad={0}>
        <div data-table-head style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          <div>Investor</div><div>Plans</div><div>Invested</div><div>Earnings</div><div />
        </div>

        {investors.length === 0 ? (
          <EmptyState compact icon={<Icon name="users" size={22} />} title="No investors found" />
        ) : investors.map((p) => {
          const t = investorTotals(p.id, data.investments)
          return (
            <div
              key={p.id} data-table-row
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {initialsOf(p)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName(p)}
                    {p.role === 'admin' && <Pill tone="brand" style={{ marginLeft: 6 }}>Admin</Pill>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.count || '—'}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.principal ? `$${money0(t.principal)}` : '—'}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.earnings ? 'var(--gain)' : 'var(--text-3)' }}>
                {t.earnings ? `+$${money0(t.earnings)}` : '—'}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setManaging(p)}>Manage</Button>
            </div>
          )
        })}
      </Card>

      {managing && (
        <ManageInvestor
          investor={managing} plans={data.plans}
          onClose={() => setManaging(null)}
          showToast={showToast}
          onDone={async () => { setManaging(null); await reload() }}
        />
      )}
    </>
  )
}

function ManageInvestor({ investor, plans, onClose, onDone, showToast }) {
  const [pane, setPane] = useState('overview')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)   // { type, row }
  const [confirming, setConfirming] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setDetail(await loadInvestorDetail(investor.id))
    } catch (e) {
      setError(e.message || 'Could not load this investor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [investor.id])

  const refresh = async (msg) => {
    await load()
    if (msg) showToast(msg)
  }

  const t = detail
    ? investorTotals(investor.id, detail.investments)
    : { principal: 0, earnings: 0, value: 0, count: 0 }

  const pending = detail?.deposits.filter((d) => d.status === 'pending').length ?? 0

  const PANES = [
    ['overview', 'Overview'],
    ['records', `Records${pending ? ` (${pending})` : ''}`],
    ['email', 'Email'],
    ['danger', 'Manage'],
  ]

  return (
    <Sheet onClose={onClose} maxWidth={620} labelledBy="mi-title">
      <SheetHeader id="mi-title" title={displayName(investor)} onClose={onClose} />
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: -10, marginBottom: 4 }}>{investor.email}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {investor.role === 'admin' && <Pill tone="brand">Admin</Pill>}
        <Pill tone={{ approved: 'gain', pending: 'warn', rejected: 'loss' }[investor.kyc_status] || 'neutral'}>
          KYC: {investor.kyc_status?.replace('_', ' ') || 'not started'}
        </Pill>
        {detail?.subscribed && <Pill tone="info">Investor Letter</Pill>}
      </div>

      <Segmented tabs={PANES} active={pane} onChange={setPane} style={{ marginBottom: 18 }} />

      {error && <Alert tone="loss" style={{ marginBottom: 14 }}>{error}</Alert>}

      {loading ? (
        <SkeletonCard rows={3} />
      ) : (
        <>
          {pane === 'overview' && (
            <InvestorOverview
              investor={investor} detail={detail} totals={t} plans={plans}
              onDone={refresh} setError={setError}
            />
          )}
          {pane === 'records' && (
            <InvestorRecords
              detail={detail}
              onEdit={(type, row) => setEditing({ type, row })}
              onDelete={(type, row) => setConfirming({ kind: 'record', type, row })}
            />
          )}
          {pane === 'email' && (
            <InvestorEmail investor={investor} showToast={showToast} setError={setError} />
          )}
          {pane === 'danger' && (
            <InvestorAdmin
              investor={investor} detail={detail} busy={busy} setBusy={setBusy}
              setError={setError} onDone={refresh}
              onDeleteUser={() => setConfirming({ kind: 'user' })}
            />
          )}
        </>
      )}

      {editing && (
        <EditRecord
          type={editing.type} row={editing.row} plans={plans}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh('Record updated') }}
        />
      )}

      {confirming && (
        <ConfirmDestructive
          confirming={confirming}
          investor={investor}
          onCancel={() => setConfirming(null)}
          onConfirmed={async (msg, closeAll) => {
            setConfirming(null)
            if (closeAll) { showToast(msg); onDone(); }
            else await refresh(msg)
          }}
          setError={setError}
        />
      )}
    </Sheet>
  )
}

/* ── overview: balances + fund ── */

function InvestorOverview({ investor, detail, totals, plans, onDone, setError }) {
  const [amount, setAmount] = useState('')
  const [planId, setPlanId] = useState('')
  const [busy, setBusy] = useState(false)

  const active = detail.investments.filter((i) => i.status === 'active')
  const pendingTotal = detail.deposits
    .filter((d) => d.status === 'pending')
    .reduce((s, d) => s + Number(d.amount || 0), 0)

  const fund = async () => {
    setError('')
    const amt = parseFloat(String(amount).replace(/,/g, '')) || 0
    if (!amt) return setError('Enter an amount.')
    setBusy(true)
    try {
      await fundInvestor({ userId: investor.id, planId: planId || null, amount: amt })
      setAmount('')
      await onDone(`Credited ${displayName(investor)} $${money0(amt)}`)
    } catch (e) {
      setError(e.message || 'Could not credit this investor.')
    } finally {
      setBusy(false)
    }
  }

  const close = async (id) => {
    setBusy(true)
    try {
      await closeInvestment(id)
      await onDone('Investment closed')
    } catch (e) {
      setError(e.message || 'Could not close that investment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        {[
          ['Invested', `$${money0(totals.principal)}`],
          ['Earnings', `+$${money0(totals.earnings)}`],
          ['Value', `$${money0(totals.value)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ flex: '1 1 120px', background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '11px 12px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k}</div>
            <div style={{ fontFamily: serif, fontSize: 17 }}>{v}</div>
          </div>
        ))}
      </div>
      {pendingTotal > 0 && (
        <Alert tone="warn" style={{ marginBottom: 16 }}>
          ${money0(pendingTotal)} in deposits awaiting your confirmation — see Records.
        </Alert>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', margin: '16px 0 10px' }}>Credit this investor</div>
      <Field label="Destination" hint="Leave as balance to credit without opening an investment.">
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={fieldStyle}>
          <option value="">Available balance (no plan)</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.annual_return_pct}% p.a.)</option>)}
        </select>
      </Field>
      <Field label="Amount (USD)">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" style={fieldStyle} />
      </Field>
      <Button full onClick={fund} busy={busy} style={{ marginBottom: 22 }}>Credit investor</Button>

      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Active investments</div>
      {active.length === 0 ? (
        <div style={{ fontSize: 13.5, color: 'var(--text-3)' }}>None.</div>
      ) : active.map((inv) => (
        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 'var(--r)', background: 'var(--surface-2)', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{inv.plan_name} · ${money0(inv.principal)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{inv.annual_return_pct}% p.a. · since {shortDate(inv.start_date)}</div>
          </div>
          <Button variant="dangerGhost" size="sm" onClick={() => close(inv.id)} busy={busy}>Close</Button>
        </div>
      ))}
    </>
  )
}

/* ── records: every row, editable ── */

const RECORD_GROUPS = [
  ['deposit', 'Deposits', (r) => `$${money0(r.amount)} · ${r.plan_name || 'To balance'}`, (r) => `${r.method_label || 'Deposit'} · ${shortDate(r.created_at)}`],
  ['withdrawal', 'Withdrawals', (r) => `$${money0(r.amount)}`, (r) => `${r.network || 'Transfer'} · ${shortDate(r.created_at)}`],
  ['investment', 'Investments', (r) => `${r.plan_name} · $${money0(r.principal)}`, (r) => `${r.annual_return_pct}% p.a. · since ${shortDate(r.start_date)}`],
]

function InvestorRecords({ detail, onEdit, onDelete }) {
  const sets = {
    deposit: detail.deposits,
    withdrawal: detail.withdrawals,
    investment: detail.investments,
  }

  return (
    <>
      {RECORD_GROUPS.map(([type, label, primary, secondary]) => {
        const rows = sets[type]
        return (
          <div key={type} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
              {label} <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>({rows.length})</span>
            </div>
            {rows.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>None on file.</div>
            ) : rows.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 'var(--r)', background: 'var(--surface-2)', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    {primary(r)}
                    {r.status && (
                      <Pill tone={{ approved: 'gain', active: 'gain', pending: 'warn', rejected: 'loss', closed: 'neutral' }[r.status] || 'neutral'}>
                        {r.status}
                      </Pill>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{secondary(r)}</div>
                  {r.admin_note && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3, fontStyle: 'italic' }}>{r.admin_note}</div>}
                </div>
                <Button variant="secondary" size="sm" onClick={() => onEdit(type, r)}>Edit</Button>
                <Button variant="dangerGhost" size="sm" onClick={() => onDelete(type, r)}>Delete</Button>
              </div>
            ))}
          </div>
        )
      })}

      {detail.audit.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Admin history</div>
          {detail.audit.slice(0, 10).map((a) => (
            <div key={a.id} style={{ fontSize: 12, color: 'var(--text-3)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <b style={{ color: 'var(--text-2)' }}>{a.action}</b> on {a.table_name.replace('public.', '')} · {a.admin_email || 'system'} · {timeAgo(a.created_at)}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ── edit one record ── */

const EDIT_FIELDS = {
  deposit: [
    ['amount', 'Amount (USD)', 'decimal'],
    ['status', 'Status', 'select', ['pending', 'approved', 'rejected']],
    ['method_label', 'Method', 'text'],
    ['reference', 'Reference', 'text'],
    ['admin_note', 'Admin note', 'text'],
  ],
  withdrawal: [
    ['amount', 'Amount (USD)', 'decimal'],
    ['status', 'Status', 'select', ['pending', 'approved', 'rejected']],
    ['bank_details', 'Destination address', 'text'],
    ['admin_note', 'Admin note', 'text'],
  ],
  investment: [
    ['principal', 'Principal (USD)', 'decimal'],
    ['annual_return_pct', 'Annual return %', 'decimal'],
    ['plan_name', 'Plan name', 'text'],
    ['status', 'Status', 'select', ['active', 'closed']],
  ],
}

function EditRecord({ type, row, onClose, onSaved }) {
  const fields = EDIT_FIELDS[type]
  const [form, setForm] = useState(() =>
    Object.fromEntries(fields.map(([k]) => [k, row[k] ?? ''])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    setBusy(true)
    try {
      const patch = {}
      for (const [k, , kind] of fields) {
        patch[k] = kind === 'decimal'
          ? (parseFloat(String(form[k]).replace(/,/g, '')) || 0)
          : (String(form[k] ?? '').trim() || null)
      }
      await updateRecord(type, row.id, patch)
      await onSaved()
    } catch (e) {
      setError(e.message || 'Could not save.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={440} labelledBy="er-title">
      <SheetHeader id="er-title" title={`Edit ${type}`} onClose={onClose} />
      <Alert tone="warn" style={{ marginBottom: 16 }}>
        Editing a financial record changes what the investor sees. The change is
        recorded in the admin history.
      </Alert>
      {fields.map(([key, label, kind, options]) => (
        <Field key={key} label={label}>
          {kind === 'select' ? (
            <select value={form[key] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={fieldStyle}>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              value={form[key] ?? ''} inputMode={kind === 'decimal' ? 'decimal' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              style={fieldStyle}
            />
          )}
        </Field>
      ))}
      {error && <Alert tone="loss" style={{ marginBottom: 12 }}>{error}</Alert>}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button full onClick={save} busy={busy}>Save changes</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  )
}

/* ── email this investor ── */

function InvestorEmail({ investor, showToast, setError }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const send = async () => {
    setError('')
    if (!subject.trim()) return setError('Enter a subject.')
    if (!body.trim()) return setError('Write a message.')
    setBusy(true)
    try {
      await sendEmail({ to: investor.email, subject: subject.trim(), body: body.trim() })
      setSubject(''); setBody(''); setSent(true)
      showToast(`Email sent to ${investor.email}`)
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      setError(e.message || 'Could not send the email.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.55 }}>
        Sends from your verified address, in the Keelstone template. Replies come
        back to you. A copy is saved to the support inbox.
      </div>
      <Field label="To">
        <input value={investor.email} disabled style={{ ...fieldStyle, opacity: 0.6 }} />
      </Field>
      <Field label="Subject">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="About your account" style={fieldStyle} />
      </Field>
      <Field label="Message">
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} rows={8}
          placeholder={`Hello ${displayName(investor).split(' ')[0]},`}
          style={{ ...fieldStyle, resize: 'vertical', minHeight: 140 }}
        />
      </Field>
      <Button full onClick={send} busy={busy}>{sent ? '✓ Sent' : 'Send email'}</Button>
    </>
  )
}

/* ── profile, role, deletion ── */

function InvestorAdmin({ investor, detail, busy, setBusy, setError, onDone, onDeleteUser }) {
  const [first, setFirst] = useState(investor.first_name || '')
  const [last, setLast] = useState(investor.last_name || '')
  const [kyc, setKyc] = useState(investor.kyc_status || 'not_started')

  const saveProfile = async () => {
    setError('')
    setBusy(true)
    try {
      await updateProfile(investor.id, { first_name: first, last_name: last })
      await onDone('Profile updated')
    } catch (e) {
      setError(e.message || 'Could not update the profile.')
    } finally { setBusy(false) }
  }

  const saveKyc = async (next) => {
    setKyc(next)
    setError('')
    setBusy(true)
    try {
      await setKycStatus(investor.id, next)
      await onDone(`KYC set to ${next.replace('_', ' ')}`)
    } catch (e) {
      setKyc(investor.kyc_status || 'not_started')
      setError(e.message || 'Could not change KYC status.')
    } finally { setBusy(false) }
  }

  const changeRole = async (next) => {
    setError('')
    setBusy(true)
    try {
      await setRole(investor.id, next)
      await onDone(next === 'admin' ? 'Promoted to admin' : 'Demoted to investor')
    } catch (e) {
      setError(e.message || 'Could not change the role.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Profile</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="First name" style={{ flex: 1 }}>
          <input value={first} onChange={(e) => setFirst(e.target.value)} style={fieldStyle} />
        </Field>
        <Field label="Last name" style={{ flex: 1 }}>
          <input value={last} onChange={(e) => setLast(e.target.value)} style={fieldStyle} />
        </Field>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: -6, marginBottom: 12 }}>
        Email is managed by Supabase Auth and can’t be changed here.
      </div>
      <Button full variant="secondary" onClick={saveProfile} busy={busy} style={{ marginBottom: 22 }}>Save profile</Button>

      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Identity verification</div>
      <Field label="KYC status" hint="Overrides whatever their submission says.">
        <select value={kyc} onChange={(e) => saveKyc(e.target.value)} style={fieldStyle} disabled={busy}>
          {['not_started', 'pending', 'approved', 'rejected'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </Field>
      {detail.kyc.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
          Latest submission: {detail.kyc[0].full_name} · {detail.kyc[0].id_type?.replace('_', ' ')} · {shortDate(detail.kyc[0].submitted_at)}
        </div>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', margin: '18px 0 10px' }}>Access</div>
      {investor.role === 'admin' ? (
        <Button full variant="secondary" onClick={() => changeRole('investor')} busy={busy} style={{ marginBottom: 22 }}>
          Demote to investor
        </Button>
      ) : (
        <Button full variant="secondary" onClick={() => changeRole('admin')} busy={busy} style={{ marginBottom: 22 }}>
          Promote to admin
        </Button>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, color: 'var(--loss)' }}>Danger zone</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 12 }}>
          Deleting removes their account and every deposit, investment,
          withdrawal and KYC record. It cannot be undone — though a snapshot is
          kept in the admin history.
        </div>
        <Button full variant="dangerGhost" onClick={onDeleteUser} disabled={investor.role === 'admin'}>
          Delete this investor
        </Button>
        {investor.role === 'admin' && (
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8 }}>
            Demote them first — admins can’t be deleted.
          </div>
        )}
      </div>
    </>
  )
}

/* ── typed confirmation for anything destructive ── */

function ConfirmDestructive({ confirming, investor, onCancel, onConfirmed, setError }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  const isUser = confirming.kind === 'user'
  const target = isUser ? investor.email : `this ${confirming.type}`
  const phrase = isUser ? investor.email : 'delete'
  const matches = typed.trim().toLowerCase() === phrase.toLowerCase()

  const go = async () => {
    setBusy(true)
    try {
      if (isUser) {
        const res = await deleteInvestor(investor.id)
        const n = (res?.deleted?.deposits ?? 0) + (res?.deleted?.investments ?? 0) + (res?.deleted?.withdrawals ?? 0)
        await onConfirmed(`Deleted ${investor.email} and ${n} record${n === 1 ? '' : 's'}`, true)
      } else {
        await deleteRecord(confirming.type, confirming.row.id)
        await onConfirmed(`${confirming.type[0].toUpperCase()}${confirming.type.slice(1)} deleted`, false)
      }
    } catch (e) {
      setError(e.message || 'Could not complete that.')
      setBusy(false)
      onCancel()
    }
  }

  return (
    <Sheet onClose={onCancel} maxWidth={420} labelledBy="cd-title">
      <SheetHeader id="cd-title" title="Are you sure?" onClose={onCancel} />
      <Alert tone="loss" style={{ marginBottom: 16 }}>
        {isUser
          ? <>This permanently deletes <b>{investor.email}</b> and every record belonging to them.</>
          : <>This permanently deletes {target}. The investor’s balance will change.</>}
      </Alert>
      <Field label={`Type "${phrase}" to confirm`}>
        <input
          value={typed} onChange={(e) => setTyped(e.target.value)}
          placeholder={phrase} autoFocus style={fieldStyle}
        />
      </Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button full variant="dangerGhost" onClick={go} busy={busy} disabled={!matches}>
          {isUser ? 'Delete investor' : 'Delete record'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Sheet>
  )
}

/* ══ requests ════════════════════════════════════════════ */

function Requests({ deposits, withdrawals, profiles, reload, showToast }) {
  const [filter, setFilter] = useState('pending')
  const byId = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles])

  const rows = [
    ...deposits.map((d) => ({ ...d, type: 'deposit' })),
    ...withdrawals.map((w) => ({ ...w, type: 'withdrawal' })),
  ]
    .filter((r) => (filter === 'all' ? true : filter === 'pending' ? r.status === 'pending' : r.type === filter))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <Card pad={18}>
      <Segmented
        tabs={[['pending', 'Pending'], ['deposit', 'Deposits'], ['withdrawal', 'Withdrawals'], ['all', 'All']]}
        active={filter} onChange={setFilter} style={{ marginBottom: 10 }}
      />
      {rows.length === 0 ? (
        <EmptyState compact icon={<Icon name="check" size={22} />} title="All clear" body="Nothing is waiting for review." />
      ) : rows.map((r) => (
        <RequestRow key={`${r.type}-${r.id}`} r={r} profile={byId[r.user_id]} reload={reload} showToast={showToast} />
      ))}
    </Card>
  )
}

function RequestRow({ r, profile, reload, showToast }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const isDep = r.type === 'deposit'

  const act = async (action) => {
    setBusy(true)
    try {
      await reviewRequest({ type: r.type, recordId: r.id, action, note })
      showToast(`${isDep ? 'Deposit' : 'Withdrawal'} ${action}d`)
      await reload()
    } catch (e) {
      showToast(e.message || 'Action failed')
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, flex: 'none', borderRadius: '50%',
            background: isDep ? 'var(--gain-soft)' : 'var(--warn-soft)',
            color: isDep ? 'var(--gain)' : 'var(--warn)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name={isDep ? 'down' : 'up'} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName(profile)} · ${money0(r.amount)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {isDep ? (r.plan_name || 'No plan') : (r.network || 'Withdrawal')} · {timeAgo(r.created_at)}
          </div>
        </div>
        <Pill status={r.status} />
      </div>

      {r.status === 'pending' && (
        <div style={{ marginTop: 10, paddingLeft: 48 }}>
          {(isDep ? (r.tx_hash || r.reference) : r.bank_details) && (
            <div style={{ marginBottom: 8, fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {isDep ? `Ref: ${r.tx_hash || r.reference}` : `To: ${r.bank_details}`}
            </div>
          )}
          {noteOpen && (
            <input
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)" aria-label="Admin note"
              style={{ ...fieldStyle, marginBottom: 8, padding: '9px 12px', fontSize: 13 }}
            />
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="sm" onClick={() => act('approve')} busy={busy} style={{ background: 'var(--gain)' }}>Approve</Button>
            <Button size="sm" variant="dangerGhost" onClick={() => act('reject')} busy={busy}>Reject</Button>
            {!noteOpen && <Button size="sm" variant="ghost" onClick={() => setNoteOpen(true)}>Add note</Button>}
          </div>
        </div>
      )}

      {r.status !== 'pending' && r.admin_note && (
        <div style={{ marginTop: 6, paddingLeft: 48, fontSize: 12, color: 'var(--text-3)' }}>Note: {r.admin_note}</div>
      )}
    </div>
  )
}

/* ══ KYC queue ═══════════════════════════════════════════ */

function KycQueue({ kyc, profiles, reload, showToast }) {
  const [filter, setFilter] = useState('submitted')
  const [viewing, setViewing] = useState(null)
  const byId = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles])
  const shown = kyc.filter((k) => filter === 'all' || k.status === filter)

  return (
    <>
      <Card pad={18}>
        <Segmented
          tabs={[['submitted', 'Awaiting review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']]}
          active={filter} onChange={setFilter} style={{ marginBottom: 10 }}
        />
        {shown.length === 0 ? (
          <EmptyState compact icon={<Icon name="shield" size={22} />} title="Nothing here" body="KYC submissions will appear here for review." />
        ) : shown.map((k) => (
          <button
            key={k.id} type="button" onClick={() => setViewing(k)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '13px 0', borderBottom: '1px solid var(--border)',
              background: 'transparent', border: 'none', borderBottomStyle: 'solid',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{k.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{byId[k.user_id]?.email || '—'} · {timeAgo(k.submitted_at)}</div>
            </div>
            <Pill status={k.status} />
          </button>
        ))}
      </Card>

      {viewing && (
        <KycReview
          submission={viewing} profile={byId[viewing.user_id]}
          onClose={() => setViewing(null)}
          onDone={async (msg) => { setViewing(null); await reload(); showToast(msg) }}
        />
      )}
    </>
  )
}

function KycReview({ submission, profile, onClose, onDone }) {
  const [urls, setUrls] = useState({})
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Documents live in a private bucket — fetch short-lived signed URLs.
  useEffect(() => {
    let active = true
    const keys = ['doc_id_front', 'doc_id_back', 'doc_selfie']
    Promise.all(keys.map((k) => (submission[k] ? getDocumentUrl(submission[k]).catch(() => null) : Promise.resolve(null))))
      .then((res) => { if (active) setUrls(Object.fromEntries(keys.map((k, i) => [k, res[i]]))) })
    return () => { active = false }
  }, [submission])

  const decide = async (action) => {
    setError('')
    if (action === 'reject' && !reason.trim()) {
      setRejecting(true)
      return setError('Give a reason so the investor knows what to fix.')
    }
    setBusy(true)
    try {
      await reviewKyc({ submissionId: submission.id, action, reason: reason.trim() })
      onDone(action === 'approve' ? 'Identity approved' : 'Submission rejected')
    } catch (e) {
      setError(e.message || 'Could not record that decision.')
      setBusy(false)
    }
  }

  const idType = ID_TYPES.find((t) => t.value === submission.id_type)?.label || submission.id_type

  return (
    <Sheet onClose={onClose} maxWidth={560} labelledBy="kyc-review">
      <SheetHeader id="kyc-review" title="Review identity" onClose={onClose} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 16 }}>
        <Pill status={submission.status} />
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Submitted {shortDate(submission.submitted_at)}</span>
      </div>

      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: 16, marginBottom: 16 }}>
        {[
          ['Name', submission.full_name],
          ['Email', profile?.email],
          ['Date of birth', submission.date_of_birth],
          ['Country', submission.country],
          ['Address', submission.address],
          ['Document', idType],
          ['Number', submission.id_number],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '6px 0', fontSize: 13.5 }}>
            <span style={{ color: 'var(--text-3)', flex: 'none' }}>{k}</span>
            <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Documents</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['doc_id_front', 'doc_id_back', 'doc_selfie'].map((k) =>
          submission[k] ? (
            urls[k] ? (
              <a key={k} href={urls[k]} target="_blank" rel="noreferrer" style={{ flex: '1 1 120px' }}>
                <img src={urls[k]} alt={k.replace(/_/g, ' ')} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', display: 'block' }} />
              </a>
            ) : (
              <div key={k} data-skeleton style={{ flex: '1 1 120px', height: 110, borderRadius: 'var(--r-sm)' }} />
            )
          ) : null,
        )}
      </div>

      {submission.status === 'submitted' && (
        <>
          {rejecting && (
            <Field label="Reason for rejection" hint="The investor sees this, so be specific.">
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                placeholder="e.g. The document photo is blurred — please retake it in better light."
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </Field>
          )}
          {error && <Alert tone="loss" style={{ marginBottom: 14 }}>{error}</Alert>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => decide('approve')} busy={busy} style={{ flex: 1, background: 'var(--gain)' }}>Approve</Button>
            <Button variant="dangerGhost" onClick={() => (rejecting ? decide('reject') : setRejecting(true))} busy={busy} style={{ flex: 1 }}>
              {rejecting ? 'Confirm rejection' : 'Reject'}
            </Button>
          </div>
        </>
      )}

      {submission.status === 'rejected' && submission.rejection_reason && (
        <Alert tone="loss"><div><b>Rejected:</b> {submission.rejection_reason}</div></Alert>
      )}
    </Sheet>
  )
}

/* ══ plans + deposit methods ═════════════════════════════ */

function Plans({ plans, methods, reload, showToast }) {
  const [editing, setEditing] = useState(null)
  const [editingMethod, setEditingMethod] = useState(null)

  return (
    <>
      <Card pad={18} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Investment plans</h2>
          <Button size="sm" onClick={() => setEditing({ name: '', annual_return_pct: 0, min_usd: 5000, max_usd: 0, risk: 'Medium', active: true, sort_order: plans.length + 1 })}>
            <Icon name="plus" size={15} /> Add
          </Button>
        </div>
        {plans.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--text-3)', padding: '8px 0' }}>No plans yet.</div>
        ) : plans.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                {p.featured && <Pill tone="brand">Featured</Pill>}
                {!p.active && <Pill tone="neutral">Hidden</Pill>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                ${money0(p.min_usd)}{p.max_usd > 0 ? ` – $${money0(p.max_usd)}` : '+'} · {p.annual_return_pct}% p.a. · {p.risk} risk
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>Edit</Button>
          </div>
        ))}
      </Card>

      <Card pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Deposit methods</h2>
          <Button size="sm" onClick={() => setEditingMethod({ name: '', symbol: '', network: '', wallet_address: '', min_amount: 0, active: true })}>
            <Icon name="plus" size={15} /> Add
          </Button>
        </div>
        {methods.length === 0 ? (
          <Alert tone="warn">No deposit methods yet — investors can’t deposit until you add one.</Alert>
        ) : methods.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{m.name}</span>
                {!m.active && <Pill tone="neutral">Hidden</Pill>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'monospace', marginTop: 2, wordBreak: 'break-all' }}>{m.wallet_address}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditingMethod(m)}>Edit</Button>
          </div>
        ))}
      </Card>

      {editing && (
        <PlanEditor plan={editing} onClose={() => setEditing(null)} onDone={async (msg) => { setEditing(null); await reload(); showToast(msg) }} />
      )}
      {editingMethod && (
        <MethodEditor method={editingMethod} onClose={() => setEditingMethod(null)} onDone={async (msg) => { setEditingMethod(null); await reload(); showToast(msg) }} />
      )}
    </>
  )
}

function PlanEditor({ plan, onClose, onDone }) {
  const [form, setForm] = useState(plan)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    if (!form.name?.trim()) return setError('Give the plan a name.')
    setBusy(true)
    try {
      await savePlan(form)
      onDone(plan.id ? 'Plan updated' : 'Plan created')
    } catch (e) {
      setError(e.message || 'Could not save.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={520} labelledBy="pe">
      <SheetHeader id="pe" title={plan.id ? `Edit ${plan.name}` : 'New plan'} onClose={onClose} />
      <Field label="Plan name"><input value={form.name || ''} onChange={(e) => set('name', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Target annual return (%)"><input type="number" value={form.annual_return_pct ?? 0} onChange={(e) => set('annual_return_pct', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Minimum (USD)"><input type="number" value={form.min_usd ?? 0} onChange={(e) => set('min_usd', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Maximum (USD)" hint="0 means no limit."><input type="number" value={form.max_usd ?? 0} onChange={(e) => set('max_usd', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Risk level"><input value={form.risk || ''} onChange={(e) => set('risk', e.target.value)} placeholder="Low / Medium / High" style={fieldStyle} /></Field>
      <Field label="Assets"><input value={form.assets || ''} onChange={(e) => set('assets', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Strategy"><textarea value={form.strategy || ''} onChange={(e) => set('strategy', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>

      {[['featured', 'Featured on the website'], ['active', 'Visible to investors']].map(([k, label]) => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--primary)' }} />
          {label}
        </label>
      ))}

      {error && <Alert tone="loss" style={{ marginTop: 12 }}>{error}</Alert>}
      <Button full onClick={save} busy={busy} style={{ marginTop: 14 }}>{plan.id ? 'Save changes' : 'Create plan'}</Button>
    </Sheet>
  )
}

function MethodEditor({ method, onClose, onDone }) {
  const [form, setForm] = useState(method)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    if (!form.name?.trim()) return setError('Give the method a name.')
    if (!form.wallet_address?.trim()) return setError('A wallet address is required.')
    setBusy(true)
    try {
      await saveDepositMethod(form)
      onDone(method.id ? 'Method updated' : 'Method added')
    } catch (e) {
      setError(e.message || 'Could not save.')
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${form.name}? Investors will no longer see it.`)) return
    setBusy(true)
    try {
      await deleteDepositMethod(method.id)
      onDone('Method removed')
    } catch (e) {
      setError(e.message || 'Could not remove.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={520} labelledBy="me">
      <SheetHeader id="me" title={method.id ? `Edit ${method.name}` : 'New deposit method'} onClose={onClose} />
      <Field label="Name"><input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="USDT" style={fieldStyle} /></Field>
      <Field label="Symbol"><input value={form.symbol || ''} onChange={(e) => set('symbol', e.target.value)} placeholder="USDT" style={fieldStyle} /></Field>
      <Field label="Network"><input value={form.network || ''} onChange={(e) => set('network', e.target.value)} placeholder="BEP-20 (BNB Smart Chain)" style={fieldStyle} /></Field>
      <Field label="Wallet address">
        <input value={form.wallet_address || ''} onChange={(e) => set('wallet_address', e.target.value)} placeholder="0x…" style={{ ...fieldStyle, fontFamily: 'monospace', fontSize: 13 }} />
      </Field>
      <Field label="Minimum amount (USD)"><input type="number" value={form.min_amount ?? 0} onChange={(e) => set('min_amount', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Instructions" hint="Shown to investors when they pick this method.">
        <textarea value={form.instructions || ''} onChange={(e) => set('instructions', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
      </Field>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.active !== false} onChange={(e) => set('active', e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--primary)' }} />
        Available to investors
      </label>

      {error && <Alert tone="loss" style={{ marginTop: 12 }}>{error}</Alert>}
      <Button full onClick={save} busy={busy} style={{ marginTop: 14 }}>{method.id ? 'Save changes' : 'Add method'}</Button>
      {method.id && <Button variant="dangerGhost" full onClick={remove} busy={busy} style={{ marginTop: 8 }}>Remove method</Button>}
    </Sheet>
  )
}

/* ══ inbox ═══════════════════════════════════════════════ */

function Inbox({ messages, reload, showToast }) {
  const [active, setActive] = useState(null)
  const [composing, setComposing] = useState(false)

  return (
    <>
      <Card pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Support inbox</h2>
          <Button size="sm" onClick={() => setComposing(true)}><Icon name="mail" size={15} /> Compose</Button>
        </div>
        {messages.length === 0 ? (
          <EmptyState compact icon={<Icon name="mail" size={22} />} title="No messages" body="Messages from investors will appear here." />
        ) : messages.map((m) => {
          const outbound = m.direction === 'outbound'
          const isNew = !outbound && m.status === 'new'
          return (
            <button
              key={m.id} type="button" onClick={() => setActive(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '13px 0', borderBottom: '1px solid var(--border)',
                background: 'transparent', border: 'none', borderBottomStyle: 'solid',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {isNew && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flex: 'none' }} />}
                  <span style={{ fontSize: 14, fontWeight: isNew ? 800 : 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {outbound ? `To: ${m.email}` : (m.name || m.email)}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.subject || '(no subject)'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <Pill tone={outbound ? 'info' : isNew ? 'brand' : 'gain'}>{outbound ? 'Sent' : isNew ? 'New' : 'Replied'}</Pill>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{timeAgo(m.created_at)}</div>
              </div>
            </button>
          )
        })}
      </Card>

      {active && (
        <MessageView message={active} onClose={() => setActive(null)} onDone={async (msg) => { setActive(null); await reload(); showToast(msg) }} />
      )}
      {composing && (
        <Compose onClose={() => setComposing(false)} onDone={async (msg) => { setComposing(false); await reload(); showToast(msg) }} />
      )}
    </>
  )
}

function MessageView({ message, onClose, onDone }) {
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setError('')
    if (!reply.trim()) return setError('Write a reply first.')
    setBusy(true)
    try {
      await sendEmail({
        to: message.email,
        subject: message.subject ? `Re: ${message.subject}` : 'Re: your message',
        body: reply,
        messageId: message.id,
      })
      onDone(`Reply sent to ${message.email}`)
    } catch (e) {
      setError(e.message || 'Could not send.')
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this message?')) return
    setBusy(true)
    try {
      await deleteMessage(message.id)
      onDone('Message deleted')
    } catch (e) {
      setError(e.message || 'Could not delete.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={560} labelledBy="mv">
      <SheetHeader id="mv" title={message.subject || '(no subject)'} onClose={onClose} />
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: -10, marginBottom: 16 }}>
        {message.direction === 'outbound' ? 'To' : 'From'} {message.name ? `${message.name} · ` : ''}{message.email} · {shortDate(message.created_at)}
      </div>

      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: 16, fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
        {message.message || '—'}
      </div>

      {message.reply_body && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gain)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
            Your reply{message.replied_by ? ` · ${message.replied_by}` : ''}
          </div>
          <div style={{ background: 'var(--gain-soft)', borderRadius: 'var(--r)', padding: 14, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {message.reply_body}
          </div>
        </>
      )}

      {message.direction !== 'outbound' && (
        <Field label="Reply by email">
          <textarea
            value={reply} onChange={(e) => setReply(e.target.value)} rows={5}
            placeholder={`Write your reply to ${message.email}…`}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </Field>
      )}

      {error && <Alert tone="loss" style={{ marginBottom: 12 }}>{error}</Alert>}

      {message.direction !== 'outbound' && <Button full onClick={send} busy={busy}>Send reply</Button>}
      <Button variant="dangerGhost" full onClick={remove} busy={busy} style={{ marginTop: 8 }}>Delete</Button>
    </Sheet>
  )
}

function Compose({ onClose, onDone }) {
  const [form, setForm] = useState({ to: '', subject: '', body: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const send = async () => {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.to.trim())) return setError('Enter a valid email address.')
    if (!form.subject.trim()) return setError('Add a subject.')
    if (!form.body.trim()) return setError('Write a message.')
    setBusy(true)
    try {
      await sendEmail({ to: form.to.trim(), subject: form.subject, body: form.body })
      onDone(`Email sent to ${form.to.trim()}`)
    } catch (e) {
      setError(e.message || 'Could not send.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={520} labelledBy="cp">
      <SheetHeader id="cp" title="Compose email" onClose={onClose} />
      <Field label="To"><input type="email" value={form.to} onChange={(e) => set('to', e.target.value)} placeholder="investor@example.com" style={fieldStyle} /></Field>
      <Field label="Subject"><input value={form.subject} onChange={(e) => set('subject', e.target.value)} style={fieldStyle} /></Field>
      <Field label="Message"><textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={7} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
      {error && <Alert tone="loss" style={{ marginBottom: 12 }}>{error}</Alert>}
      <Button full onClick={send} busy={busy}>Send email</Button>
    </Sheet>
  )
}
