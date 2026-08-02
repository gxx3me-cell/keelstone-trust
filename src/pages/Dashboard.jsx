import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../dashboard/dashboard.css'
import { supabase } from '../lib/supabase'
import { listDepositMethods, submitDeposit, submitWithdrawal, getMyPortfolio, listPlans } from '../lib/deposits'
import { useAuth } from '../hooks/useAuth'
import { useI18n, useDates } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'
import BrandSplash from '../components/BrandSplash'
import KycSection from '../dashboard/KycSection'
import { subscribe, unsubscribe, getMySubscription } from '../lib/newsletter'
import {
  serif, money, money0, timeAgo, shortDate,
  Card, Button, Pill, EmptyState, SkeletonCard, SkeletonLine,
  Sheet, SheetHeader, Field, fieldStyle, Alert, Segmented, Toast, Icon,
} from '../dashboard/ui'

/**
 * Bitcoin address validation.
 *
 * Format-only — it confirms the shape, not that the address exists or that
 * anyone holds its key. Full validation needs a Base58Check/Bech32 checksum,
 * which belongs server-side when payouts are actually wired up.
 *
 *   1…  P2PKH   (legacy)      Base58, 26–34 chars, no 0/O/I/l
 *   3…  P2SH    (SegWit-wrapped)
 *   bc1 Bech32  (native SegWit / Taproot), lowercase, no 1/b/i/o
 *
 * Testnet prefixes (m, n, 2, tb1) are deliberately rejected — sending real
 * funds to a testnet address loses them.
 */
export function isBtcAddress(value) {
  const addr = String(value || '').trim()
  if (!addr) return false
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) return true          // legacy / P2SH
  if (/^bc1[023456789acdefghjklmnpqrstuvwxyz]{11,71}$/.test(addr)) return true  // bech32, lowercase
  if (/^BC1[023456789ACDEFGHJKLMNPQRSTUVWXYZ]{11,71}$/.test(addr)) return true  // bech32, uppercase
  return false
}

/* Four sections — down from seven. Everything financial lives under
   "Invest"; statements, profile and KYC live under "Account". */
const TABS = [
  ['home', 'dash.home', 'home'],
  ['invest', 'dash.invest', 'wallet'],
  ['activity', 'dash.activity', 'activity'],
  ['account', 'dash.account', 'user'],
]

export default function Dashboard() {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const { user, profile, loading, isAuthenticated, refresh, emailVerified } = useAuth()

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lumen-theme') || 'light' } catch { return 'light' }
  })
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem('keelstone-tab')
      return TABS.some(([k]) => k === saved) ? saved : 'home'
    } catch { return 'home' }
  })
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [methods, setMethods] = useState([])

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3400) }

  useEffect(() => { try { localStorage.setItem('lumen-theme', theme) } catch {} }, [theme])
  useEffect(() => { try { localStorage.setItem('keelstone-tab', tab) } catch {} }, [tab])

  const loadPortfolio = async () => {
    try {
      setPortfolio(await getMyPortfolio())
    } catch {
      setPortfolio(null)
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    if (loading || !isAuthenticated) return
    loadPortfolio()
    listPlans().then(setPlans).catch(() => setPlans([]))
    listDepositMethods().then(setMethods).catch(() => setMethods([]))
  }, [loading, isAuthenticated])

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login', { replace: true })
  }, [loading, isAuthenticated, navigate])

  // Names live on the profile row now, not on the auth user.
  const firstName = profile?.first_name || ''
  const lastName = profile?.last_name || ''
  const fullName = profile?.full_name || `${firstName} ${lastName}`.trim() || 'Investor'
  const userEmail = user?.email || ''
  const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || fullName.slice(0, 2).toUpperCase()

  const hasInvestments = !!portfolio && portfolio.investment_count > 0

  const goTab = (t) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <BrandSplash />

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('dash.goodMorning')
    if (h < 18) return t('dash.goodAfternoon')
    return t('dash.goodEvening')
  })()

  return (
    <div
      ref={rootRef}
      data-root
      data-theme={theme}
      style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      <DesktopSidebar
        tab={tab} goTab={goTab} fullName={fullName} userEmail={userEmail}
        initials={initials} onDeposit={() => setModal('deposit')}
      />

      <main data-main style={{ flex: 1, marginLeft: 248, padding: '0 28px 40px', minWidth: 0, maxWidth: 1100 }}>
        <TopBar
          title={t(TABS.find(([k]) => k === tab)?.[1] || '')}
          greeting={tab === 'home' ? `${greeting}, ${firstName || 'there'}` : null}
          theme={theme} setTheme={setTheme}
        />

        {tab === 'home' && (
          <section data-pane key="home">
            <BalanceHero
              portfolio={portfolio} loading={portfolioLoading}
              onDeposit={() => setModal('deposit')} onWithdraw={() => setModal('withdraw')}
            />
            {portfolioLoading ? (
              <div style={{ marginTop: 14 }}><SkeletonCard rows={2} /></div>
            ) : hasInvestments ? (
              <>
                <StatRow portfolio={portfolio} />
                <HoldingsList portfolio={portfolio} onAdd={() => setModal('deposit')} />
                <RecentActivity portfolio={portfolio} onSeeAll={() => goTab('activity')} limit={4} />
              </>
            ) : (
              <StartInvesting plans={plans} onStart={() => setModal('deposit')} />
            )}
          </section>
        )}

        {tab === 'invest' && (
          <section data-pane key="invest">
            <InvestScreen
              portfolio={portfolio} plans={plans} loading={portfolioLoading}
              onDeposit={() => setModal('deposit')}
            />
          </section>
        )}

        {tab === 'activity' && (
          <section data-pane key="activity">
            <ActivityScreen portfolio={portfolio} loading={portfolioLoading} />
          </section>
        )}

        {tab === 'account' && (
          <section data-pane key="account">
            <AccountScreen
              user={user} profile={profile} fullName={fullName} userEmail={userEmail} initials={initials}
              portfolio={portfolio} theme={theme} setTheme={setTheme}
              showToast={showToast} refresh={refresh}
              onSignOut={async () => { await supabase.auth.signOut(); navigate('/login') }}
            />
          </section>
        )}
      </main>

      {/* Mobile bottom tab bar — the primary navigation on phones */}
      <nav data-tabbar aria-label="Main">
        {TABS.map(([key, label, icon]) => (
          <button
            key={key} type="button" onClick={() => goTab(key)}
            {...(tab === key ? { 'data-active': '' } : {})}
            aria-current={tab === key ? 'page' : undefined}
          >
            <Icon name={icon} size={22} />
            {t(label)}
          </button>
        ))}
      </nav>

      {modal === 'deposit' && (
        <DepositSheet
          plans={plans} methods={methods}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadPortfolio(); showToast(t('deposit.submitted')) }}
        />
      )}
      {modal === 'withdraw' && (
        <WithdrawSheet
          portfolio={portfolio}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadPortfolio(); showToast(t('withdraw.submitted')) }}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}

/* ══ chrome ══════════════════════════════════════════════ */

function DesktopSidebar({ tab, goTab, fullName, userEmail, initials, onDeposit }) {
  const { t } = useI18n()
  return (
    <aside
      data-sidebar
      style={{
        width: 248, flex: 'none', position: 'fixed', top: 0, left: 0, height: '100vh',
        background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 14px', zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px' }}>
        <img src="/uploads/kneelstone-logo.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain', flex: 'none' }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: serif, fontSize: 16, color: 'var(--text)', lineHeight: 1.15 }}>Keelstone</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t('dash.investor')}</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {TABS.map(([key, label, icon]) => {
          const active = tab === key
          return (
            <button
              key={key} type="button" onClick={() => goTab(key)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                borderRadius: 'var(--r)', border: 'none',
                background: active ? 'var(--primary-soft)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-2)',
                fontSize: 14.5, fontWeight: active ? 700 : 500,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <Icon name={icon} size={20} /> {t(label)}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button onClick={onDeposit} full>
          <Icon name="plus" size={17} /> {t('dash.addFunds')}
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 6px 0', borderTop: '1px solid var(--border)' }}>
          <Avatar initials={initials} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Avatar({ initials, size = 40 }) {
  return (
    <div
      style={{
        width: size, height: size, flex: 'none', borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.36,
      }}
    >
      {initials || '?'}
    </div>
  )
}

function TopBar({ title, greeting, theme, setTheme }) {
  const { t } = useI18n()
  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '18px 0 14px', background: 'var(--bg)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {greeting ? (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600 }}>{greeting}</div>
            <h1 data-pagetitle style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: '2px 0 0', color: 'var(--text)' }}>
              {t('dash.yourPortfolio')}
            </h1>
          </>
        ) : (
          <h1 data-pagetitle style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, margin: 0, color: 'var(--text)' }}>{title}</h1>
        )}
      </div>
      <button
        type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          width: 40, height: 40, flex: 'none', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
    </div>
  )
}

/* ══ home ════════════════════════════════════════════════ */

function BalanceHero({ portfolio, loading, onDeposit, onWithdraw }) {
  const { t } = useI18n()
  const value = portfolio?.total_value || 0
  const earnings = portfolio?.total_earnings || 0
  const pct = portfolio?.return_pct || 0
  const up = earnings >= 0
  const funded = !!portfolio?.investment_count
  const availableBalance = portfolio?.available_balance || 0
  const withdrawPending = portfolio?.withdraw_pending_total || 0

  return (
    <Card
      pad={24}
      style={{
        background: 'linear-gradient(150deg, #2a1758 0%, #111018 100%)',
        border: 'none', color: '#fff', boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.72)', fontWeight: 600, marginBottom: 8 }}>
        {t('dash.totalValue')}
      </div>

      {loading ? (
        <SkeletonLine w="60%" h={40} style={{ marginBottom: 18, background: 'rgba(255,255,255,.15)' }} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: funded ? 10 : 20 }}>
            <div style={{ fontFamily: serif, fontSize: 'clamp(34px,9vw,44px)', lineHeight: 1 }}>${money(value)}</div>
            {funded && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 11px', borderRadius: 999,
                  background: 'rgba(255,255,255,.16)', fontSize: 13, fontWeight: 700,
                }}
              >
                <Icon name={up ? 'up' : 'down'} size={13} /> {up ? '+' : ''}{pct}%
              </span>
            )}
          </div>
          {funded && (
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', marginBottom: availableBalance > 0 || withdrawPending > 0 ? 12 : 20 }}>
              {up ? '+' : ''}${money(earnings)} earned · ${money(portfolio.total_principal)} invested
            </div>
          )}
          {/* Uninvested cash, shown separately so a withdrawal visibly reduces
              it — the headline figure alone made payouts look like they had
              no effect. */}
          {(availableBalance > 0 || withdrawPending > 0) && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '10px 13px',
                background: 'rgba(255,255,255,.1)', borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
                {t('withdraw.availableToWithdraw')}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                ${money(portfolio.withdrawable ?? availableBalance)}
                {withdrawPending > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginLeft: 7 }}>
                    ${money(withdrawPending)} pending
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={onDeposit} style={{ flex: 1, background: '#fff', color: '#2a1758' }}>
          <Icon name="plus" size={17} /> Add funds
        </Button>
        <Button
          onClick={onWithdraw}
          style={{ flex: 1, background: 'rgba(255,255,255,.14)', color: '#fff', border: '1px solid rgba(255,255,255,.24)' }}
        >
          <Icon name="up" size={17} /> {t('dash.withdraw')}
        </Button>
      </div>
    </Card>
  )
}

function StatRow({ portfolio }) {
  const { t } = useI18n()
  const stats = [
    [t('dash.invested'), `$${money0(portfolio.total_principal)}`, 'var(--text)'],
    [t('dash.earned'), `+$${money0(portfolio.total_earnings)}`, 'var(--gain)'],
    [t('dash.plansCount'), String(portfolio.investment_count), 'var(--text)'],
  ]
  return (
    <div data-statgrid style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
      {stats.map(([label, val, color]) => (
        <Card key={label} pad={14}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <div style={{ fontFamily: serif, fontSize: 20, color }}>{val}</div>
        </Card>
      ))}
    </div>
  )
}

/* Purple-led, with the logo green appearing once as an accent. */
const PLAN_TINTS = ['#6d28d9', '#7c3aed', '#137045', '#a16207', '#4338ca']

function PlanBadge({ name, i, size = 40 }) {
  return (
    <div
      style={{
        width: size, height: size, flex: 'none', borderRadius: 'var(--r-sm)',
        background: PLAN_TINTS[i % PLAN_TINTS.length], color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: serif, fontSize: size * 0.38,
      }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function HoldingsList({ portfolio, onAdd }) {
  const { t } = useI18n()
  return (
    <Card style={{ marginTop: 14 }} pad={0}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{t('dash.yourPlans')}</h2>
        <Button variant="ghost" size="sm" onClick={onAdd}>{t('common.add')}</Button>
      </div>
      {portfolio.investments.map((inv, i) => (
        <div
          key={inv.id}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: '1px solid var(--border)' }}
        >
          <PlanBadge name={inv.plan_name} i={i} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{inv.plan_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {inv.annual_return_pct}% p.a. · since {shortDate(inv.start_date)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div style={{ fontFamily: serif, fontSize: 17, color: 'var(--text)' }}>${money0(inv.current_value)}</div>
            <div style={{ fontSize: 12, color: 'var(--gain)', fontWeight: 700 }}>+${money0(inv.earnings)}</div>
          </div>
        </div>
      ))}
    </Card>
  )
}

function StartInvesting({ plans, onStart }) {
  const { t } = useI18n()
  return (
    <Card style={{ marginTop: 14 }} pad={0}>
      <EmptyState
        icon={<Icon name="chart" size={26} />}
        title={t('dash.startFirstTitle')}
        body={t('dash.startFirstBody')}
        action={<Button onClick={onStart} size="lg">{t('common.getStarted')}</Button>}
      />
      {plans.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            {t('dash.availablePlans')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plans.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 'var(--r)', background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>From ${money0(p.min_usd)} · {p.risk} risk</div>
                </div>
                <div style={{ fontFamily: serif, fontSize: 19, color: 'var(--primary)', flex: 'none' }}>
                  {p.annual_return_pct ? `${p.annual_return_pct}%` : 'Custom'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

/* ══ invest ══════════════════════════════════════════════ */

function InvestScreen({ portfolio, plans, loading, onDeposit }) {
  const { t } = useI18n()
  if (loading) return <SkeletonCard rows={4} />
  const hasAny = portfolio && portfolio.investment_count > 0

  return (
    <>
      {hasAny ? (
        <>
          <Card pad={20}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>{t('dash.investedCapital')}</div>
            <div style={{ fontFamily: serif, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
              ${money(portfolio.total_principal)}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--gain)', fontWeight: 700, marginBottom: 18 }}>
              +${money(portfolio.total_earnings)} earned · {portfolio.return_pct}% return
            </div>
            <AllocationBar portfolio={portfolio} />
          </Card>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {portfolio.investments.map((inv, i) => (
              <Card key={inv.id} pad={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <PlanBadge name={inv.plan_name} i={i} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{inv.plan_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Since {shortDate(inv.start_date)}</div>
                  </div>
                  <Pill tone="gain">{inv.annual_return_pct}% p.a.</Pill>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    [t('dash.invested'), `$${money0(inv.principal)}`, 'var(--text)'],
                    [t('dash.earned'), `+$${money0(inv.earnings)}`, 'var(--gain)'],
                    [t('dash.value'), `$${money0(inv.current_value)}`, 'var(--text)'],
                  ].map(([k, v, c]) => (
                    <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card pad={0}>
          <EmptyState
            icon={<Icon name="wallet" size={26} />}
            title={t('dash.noInvestmentsTitle')}
            body={t('dash.noInvestmentsBody')}
            action={<Button onClick={onDeposit} size="lg">{t('dash.choosePlan')}</Button>}
          />
        </Card>
      )}

      <Card style={{ marginTop: 14 }} pad={18}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
          {hasAny ? t('dash.addAnotherPlan') : t('dash.availablePlans')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.55 }}>
          {t('dash.plansSubtitle')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map((p) => (
            <button
              key={p.id} type="button" onClick={onDeposit}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: 14, borderRadius: 'var(--r)', cursor: 'pointer',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  From ${money0(p.min_usd)}{p.max_usd > 0 ? ` – $${money0(p.max_usd)}` : ''} · {p.risk} risk
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div style={{ fontFamily: serif, fontSize: 20, color: 'var(--primary)', lineHeight: 1 }}>
                  {p.annual_return_pct ? `${p.annual_return_pct}%` : 'Custom'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, marginTop: 3 }}>
                  {p.annual_return_pct ? 'per year' : 'bespoke'}
                </div>
              </div>
              <Icon name="arrowRight" size={18} style={{ color: 'var(--text-3)' }} />
            </button>
          ))}
        </div>
      </Card>
    </>
  )
}

function AllocationBar({ portfolio }) {
  const total = portfolio.total_value || 1
  return (
    <>
      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
        {portfolio.investments.map((inv, i) => (
          <div key={inv.id} style={{ width: `${(inv.current_value / total) * 100}%`, background: PLAN_TINTS[i % PLAN_TINTS.length] }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
        {portfolio.investments.map((inv, i) => (
          <span key={inv.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLAN_TINTS[i % PLAN_TINTS.length] }} />
            {inv.plan_name} {Math.round((inv.current_value / total) * 100)}%
          </span>
        ))}
      </div>
    </>
  )
}

/* ══ activity ════════════════════════════════════════════ */

function useActivity(portfolio) {
  return useMemo(() => ([
    ...((portfolio?.deposits) || []).map((d) => ({ ...d, kind: 'deposit' })),
    ...((portfolio?.withdrawals) || []).map((w) => ({ ...w, kind: 'withdrawal' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))), [portfolio])
}

function ActivityRow({ tx }) {
  const { t } = useI18n()
  const { timeAgo } = useDates()
  const isDep = tx.kind === 'deposit'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          width: 38, height: 38, flex: 'none', borderRadius: '50%',
          background: isDep ? 'var(--gain-soft)' : 'var(--surface-2)',
          color: isDep ? 'var(--gain)' : 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={isDep ? 'down' : 'up'} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {isDep ? t('dash.deposit') : t('dash.withdrawal')}{tx.plan_name ? ` · ${tx.plan_name}` : ''}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{timeAgo(tx.created_at)}</div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: isDep ? 'var(--gain)' : 'var(--text)' }}>
          {isDep ? '+' : '−'}${money0(tx.amount || 0)}
        </div>
        <Pill status={tx.status || 'pending'} />
      </div>
    </div>
  )
}

function RecentActivity({ portfolio, onSeeAll, limit }) {
  const { t } = useI18n()
  const acts = useActivity(portfolio).slice(0, limit)
  if (!acts.length) return null
  return (
    <Card style={{ marginTop: 14 }} pad={18}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{t('dash.recentActivity')}</h2>
        <Button variant="ghost" size="sm" onClick={onSeeAll}>{t('common.seeAll')}</Button>
      </div>
      {acts.map((t) => <ActivityRow key={`${t.kind}-${t.id}`} tx={t} />)}
    </Card>
  )
}

function ActivityScreen({ portfolio, loading }) {
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const acts = useActivity(portfolio)
  const shown = acts.filter((a) => filter === 'all' || a.kind === filter)

  if (loading) return <SkeletonCard rows={5} />

  return (
    <Card pad={18}>
      <Segmented
        tabs={[['all', t('dash.allFilter')], ['deposit', t('dash.deposits')], ['withdrawal', t('dash.withdrawals')]]}
        active={filter} onChange={setFilter}
        style={{ marginBottom: 8 }}
      />
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon={<Icon name="activity" size={24} />}
          title={t('dash.nothingYet')}
          body={filter === 'all' ? 'Your deposits and withdrawals will appear here.' : `No ${filter}s yet.`}
        />
      ) : (
        shown.map((t) => <ActivityRow key={`${t.kind}-${t.id}`} tx={t} />)
      )}
    </Card>
  )
}

/* ══ account ═════════════════════════════════════════════ */

function AccountScreen({ user, profile, fullName, userEmail, initials, portfolio, theme, setTheme, showToast, refresh, onSignOut }) {
  const { t } = useI18n()
  // Supabase marks confirmation with a timestamp, not a boolean.
  const emailVerified = !!user?.email_confirmed_at
  const [resend, setResend] = useState('')

  const handleResend = async () => {
    setResend('sending')
    const { error } = await supabase.auth.resend({ type: 'signup', email: userEmail })
    setResend(error ? 'error' : 'sent')
  }

  const downloadStatement = () => {
    if (!portfolio) return
    const today = new Date().toISOString().slice(0, 10)
    const lines = [
      'KEELSTONE TRUST — ACCOUNT STATEMENT',
      '='.repeat(44),
      `Generated:  ${today}`,
      `Investor:   ${fullName}`,
      `Email:      ${userEmail}`,
      '',
      'SUMMARY',
      '-'.repeat(44),
      `Total invested:    $${money(portfolio.total_principal)}`,
      `Earnings to date:  +$${money(portfolio.total_earnings)}`,
      `Invested value:    $${money(portfolio.invested_value)}`,
      `Available balance: $${money(portfolio.available_balance)}`,
      `Total value:       $${money(portfolio.total_value)}`,
      `Total return:      +${portfolio.return_pct}%`,
      '',
      ...(portfolio.withdrawals?.some((w) => w.status === 'approved')
        ? [
            'WITHDRAWALS PAID',
            '-'.repeat(44),
            ...portfolio.withdrawals
              .filter((w) => w.status === 'approved')
              .map((w) => `$${money(w.amount)} — ${shortDate(w.reviewed_at || w.created_at)}${w.bank_details ? ` · ${w.bank_details}` : ''}`),
            '',
          ]
        : []),
      'INVESTMENTS',
      '-'.repeat(44),
      ...portfolio.investments.map((i) =>
        `${i.plan_name} — $${money(i.principal)} @ ${i.annual_return_pct}% p.a. · earned +$${money(i.earnings)} · now $${money(i.current_value)} (since ${shortDate(i.start_date)})`),
      '',
      'Returns accrue daily. This statement reflects your account at the time of generation.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keelstone-statement-${today}.txt`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const canDownload = !!portfolio?.investment_count

  return (
    <>
      <Card pad={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={initials} size={56} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{fullName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
          </div>
        </div>
      </Card>

      {!emailVerified && (
        <Alert tone="warn" style={{ marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 170 }}>{t('dash.verifyEmailPrompt')}</div>
          <Button
            size="sm" variant="secondary" onClick={handleResend}
            disabled={resend === 'sending' || resend === 'sent'}
            style={{ background: 'var(--surface)' }}
          >
            {resend === 'sending' ? 'Sending…' : resend === 'sent' ? 'Sent ✓' : resend === 'error' ? 'Try again' : 'Resend'}
          </Button>
        </Alert>
      )}

      <KycSection user={user} profile={profile} showToast={showToast} refresh={refresh} />

      <Card style={{ marginTop: 12 }} pad={0}>
        <div style={{ padding: '16px 18px 8px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('dash.statements')}</div>
        <button
          type="button" onClick={downloadStatement} disabled={!canDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '14px 18px', borderTop: '1px solid var(--border)',
            background: 'transparent', border: 'none', borderTopStyle: 'solid',
            cursor: canDownload ? 'pointer' : 'not-allowed', opacity: canDownload ? 1 : 0.5,
            fontFamily: 'inherit', textAlign: 'left', color: 'var(--text)',
          }}
        >
          <Icon name="download" size={20} style={{ color: 'var(--primary)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t('dash.downloadStatement')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {canDownload ? 'Built from your live portfolio' : 'Available once you have an investment'}
            </div>
          </div>
        </button>
      </Card>

      <Card style={{ marginTop: 12 }} pad={0}>
        <div style={{ padding: '16px 18px 8px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('dash.preferences')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={20} style={{ color: 'var(--text-2)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t('dash.darkMode')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('dash.darkModeHint')}</div>
          </div>
          <Switch on={theme === 'dark'} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} label={t('dash.darkMode')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          <Icon name="settings" size={20} style={{ color: 'var(--text-2)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t('common.language')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('dash.languageHint')}</div>
          </div>
          <LanguageSwitcher />
        </div>
        <NewsletterPreference userEmail={userEmail} showToast={showToast} />
      </Card>

      <Button variant="dangerGhost" full onClick={onSignOut} style={{ marginTop: 16 }}>
        <Icon name="logout" size={18} /> {t('common.signOut')}
      </Button>
    </>
  )
}

/* The Keelstone Trust Investor Letter — opt in/out from the dashboard.
   Optimistic: the switch moves immediately and reverts if the write fails,
   because a toggle that lags feels broken. */
function NewsletterPreference({ userEmail, showToast }) {
  const [on, setOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getMySubscription()
      .then((sub) => { if (active) setOn(sub?.status === 'subscribed') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const toggle = async () => {
    if (busy || loading) return
    const next = !on
    setOn(next)
    setBusy(true)
    try {
      if (next) await subscribe(userEmail, 'dashboard')
      else await unsubscribe()
      showToast?.(next ? 'Subscribed to the Investor Letter.' : 'Unsubscribed from the Investor Letter.')
    } catch (err) {
      setOn(!next)
      showToast?.(err?.message || 'Could not update your preference.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
      <Icon name="mail" size={20} style={{ color: 'var(--text-2)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Investor Letter</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {loading ? 'Checking…' : 'Monthly strategy and portfolio commentary'}
        </div>
      </div>
      <Switch on={on} onToggle={toggle} label="Investor Letter" />
    </div>
  )
}

function Switch({ on, onToggle, label }) {
  return (
    <button
      type="button" onClick={onToggle} role="switch" aria-checked={on} aria-label={label}
      style={{
        width: 50, height: 30, flex: 'none', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: on ? 'var(--primary)' : 'var(--surface-3)',
        position: 'relative', transition: 'background .22s',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 23 : 3,
          width: 24, height: 24, borderRadius: '50%', background: '#fff',
          transition: 'left .22s', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        }}
      />
    </button>
  )
}

/* ══ sheets ══════════════════════════════════════════════ */

function StepDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 18 }} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < current ? 'var(--primary)' : 'var(--surface-3)',
            transition: 'background .25s',
          }}
        />
      ))}
    </div>
  )
}

function DepositSheet({ plans, methods, onClose, onDone }) {
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState(null)
  const [reference, setReference] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const amt = parseFloat(String(amount).replace(/,/g, '')) || 0

  const next = () => {
    setError('')
    if (step === 1) {
      if (!plan) return setError(t('deposit.chooseToContinue'))
      if (!amount) setAmount(String(plan.min_usd || ''))
      return setStep(2)
    }
    if (step === 2) {
      if (!amt) return setError(t('deposit.enterAmount'))
      if (plan.min_usd && amt < plan.min_usd) return setError(`The minimum for ${plan.name} is $${money0(plan.min_usd)}.`)
      if (plan.max_usd > 0 && amt > plan.max_usd) return setError(`The maximum for ${plan.name} is $${money0(plan.max_usd)}.`)
      if (!methods.length) return setError(t('deposit.noMethods'))
      return setStep(3)
    }
  }

  const copyAddress = async () => {
    if (!method?.wallet_address) return
    try {
      await navigator.clipboard.writeText(method.wallet_address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy automatically — select the address and copy it manually.')
    }
  }

  const submit = async () => {
    setError('')
    if (!method) return setError(t('deposit.chooseMethod'))
    if (method.min_amount > 0 && amt < method.min_amount) {
      return setError(`The minimum ${method.name} deposit is $${money0(method.min_amount)}.`)
    }
    setBusy(true)
    try {
      await submitDeposit({ amount: amt, methodId: method.id, planId: plan.id, reference: reference.trim() })
      onDone()
    } catch (e) {
      setError(e?.message || 'Could not submit your deposit. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} labelledBy="dep-title">
      <SheetHeader id="dep-title" title={[t('deposit.step1'), t('deposit.step2'), t('deposit.step3')][step - 1]} onClose={onClose} />
      <StepDots total={3} current={step} />

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.length === 0 && (
            <Alert tone="info">{t('deposit.noPlans')}</Alert>
          )}
          {plans.map((p) => {
            const on = plan?.id === p.id
            return (
              <button
                key={p.id} type="button" onClick={() => setPlan(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: 14, borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? 'var(--primary-soft)' : 'var(--surface-2)',
                  border: `2px solid ${on ? 'var(--primary)' : 'transparent'}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>From ${money0(p.min_usd)} · {p.risk} risk</div>
                </div>
                <div style={{ fontFamily: serif, fontSize: 20, color: 'var(--primary)' }}>
                  {p.annual_return_pct ? `${p.annual_return_pct}%` : 'Custom'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
            Investing in <b style={{ color: 'var(--text)' }}>{plan.name}</b> · minimum ${money0(plan.min_usd)}
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: 14,
            }}
          >
            <span style={{ fontFamily: serif, fontSize: 30, color: 'var(--text-3)' }}>$</span>
            <input
              value={amount} onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal" placeholder="0" autoFocus aria-label="Amount to invest"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 30, color: 'var(--text)', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[plan.min_usd, plan.min_usd * 2, plan.min_usd * 5].filter(Boolean).map((v) => (
              <Button key={v} variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setAmount(String(v))}>
                ${money0(v)}
              </Button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
            Send <b style={{ color: 'var(--text)' }}>${money(amt)}</b> using one of the methods below, then submit this form.
            We’ll confirm the transfer and activate your {plan.name} plan.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {methods.map((m) => {
              const on = method?.id === m.id
              return (
                <div
                  key={m.id}
                  style={{
                    borderRadius: 'var(--r)',
                    background: on ? 'var(--primary-soft)' : 'var(--surface-2)',
                    border: `2px solid ${on ? 'var(--primary)' : 'transparent'}`,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button" onClick={() => setMethod(m)}
                    style={{
                      textAlign: 'left', width: '100%', padding: 14, cursor: 'pointer',
                      background: 'transparent', border: 'none', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {m.name}{m.symbol ? ` · ${m.symbol}` : ''}
                    </div>
                    {m.network && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{m.network}</div>}
                    {m.min_amount > 0 && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Minimum ${money0(m.min_amount)}</div>
                    )}
                  </button>

                  {on && m.wallet_address && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <div
                        style={{
                          padding: '11px 12px', borderRadius: 'var(--r-sm)',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          fontFamily: 'monospace', fontSize: 12, color: 'var(--text)',
                          wordBreak: 'break-all', marginBottom: 8,
                        }}
                      >
                        {m.wallet_address}
                      </div>
                      <Button variant="secondary" size="sm" full onClick={copyAddress}>
                        {copied ? t('deposit.copied') : t('deposit.copyAddress')}
                      </Button>
                      {m.instructions && (
                        <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{m.instructions}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Field label={t('deposit.reference')} hint={t('deposit.referenceHint')}>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t('common.optional')} style={fieldStyle} />
          </Field>
        </>
      )}

      {error && <Alert tone="loss" style={{ marginTop: 14 }}>{error}</Alert>}

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {step > 1 && (
          <Button variant="secondary" onClick={() => { setError(''); setStep(step - 1) }} style={{ flex: 'none' }}>
            {t('common.back')}
          </Button>
        )}
        <Button onClick={step === 3 ? submit : next} busy={busy} style={{ flex: 1 }}>
          {step === 3 ? (busy ? t('common.submitting') : t('deposit.sentPayment')) : t('common.continue')}
        </Button>
      </div>
    </Sheet>
  )
}

function WithdrawSheet({ portfolio, onClose, onDone }) {
  const { t } = useI18n()
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Only uninvested, un-spoken-for funds can be withdrawn — not the headline
  // portfolio value, which includes capital locked in active investments.
  const available = portfolio?.withdrawable ?? 0
  const heldForPending = portfolio?.withdraw_pending_total ?? 0
  const cashShare = portfolio?.available_balance ?? 0
  const investedShare = portfolio?.invested_value ?? 0
  const amt = parseFloat(String(amount).replace(/,/g, '')) || 0

  const submit = async () => {
    setError('')
    const addr = address.trim()
    if (!amt) return setError(t('withdraw.enterAmount'))
    if (amt > available) {
      return setError(
        available > 0
          ? `You can withdraw up to $${money(available)}.`
          : 'You have no funds available to withdraw right now.',
      )
    }
    if (!isBtcAddress(addr)) {
      return setError('Enter a valid Bitcoin address (starting with 1, 3, or bc1).')
    }
    setBusy(true)
    try {
      await submitWithdrawal({ amount: amt, address: addr })
      onDone()
    } catch (e) {
      setError(e?.message || 'Could not submit your request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} labelledBy="wd-title">
      <SheetHeader id="wd-title" title={t('withdraw.title')} onClose={onClose} />

      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 18,
        }}
      >
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, display: 'block' }}>{t('withdraw.availableToWithdraw')}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            {heldForPending > 0
              ? `$${money(heldForPending)} held for a pending request`
              : 'Includes capital held in your active plans'}
          </span>
        </div>
        <span style={{ fontFamily: serif, fontSize: 21, color: 'var(--text)' }}>${money(available)}</span>
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: 8,
        }}
      >
        <span style={{ fontFamily: serif, fontSize: 30, color: 'var(--text-3)' }}>$</span>
        <input
          value={amount} onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal" placeholder="0" autoFocus aria-label="Amount to withdraw"
          style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: serif, fontSize: 30, color: 'var(--text)', width: '100%' }}
        />
      </div>
      <Button
        variant="ghost" size="sm" disabled={available <= 0}
        onClick={() => setAmount(String(available))} style={{ marginBottom: 14 }}
      >
        {t('withdraw.withdrawAll')}
      </Button>

      <Field
        label="Bitcoin address"
        hint="Starts with 1, 3, or bc1. Bitcoin network only — we can’t recover funds sent to an address on another network."
      >
        <input
          value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder="bc1…" autoCapitalize="off" autoCorrect="off" spellCheck="false"
          style={{ ...fieldStyle, fontFamily: 'monospace', fontSize: 13.5 }}
        />
      </Field>

      <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 16 }}>
        {t('withdraw.reviewNoticeShort')}
      </div>

      {error && <Alert tone="loss" style={{ marginBottom: 14 }}>{error}</Alert>}

      {investedShare > 0 && amt > 0 && amt > cashShare && (
        <Alert tone="warn" style={{ marginBottom: 14 }}>
          {t('withdraw.exceedsCash', { amount: `$${money(cashShare)}` })}
        </Alert>
      )}

      <Button onClick={submit} busy={busy} full size="lg">
        {busy ? t('common.submitting') : t('withdraw.request')}
      </Button>
    </Sheet>
  )
}
