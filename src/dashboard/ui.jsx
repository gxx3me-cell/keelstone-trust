/* Shared dashboard primitives — Keelstone Trust.
   Used by both the investor and admin dashboards so the two stay
   visually identical and behave the same on mobile. */

import { useEffect } from 'react'
import { useI18n } from '../i18n'

export const serif = "'DM Serif Display',serif"

/* ── formatting ─────────────────────────────────────────── */

export const money = (n, dp = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const money0 = (n) => money(n, 0)

// "2 minutes ago" — used by activity + notifications
export function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.floor((Date.now() - then) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

/* ── surfaces ───────────────────────────────────────────── */

export const Card = ({ children, pad = 20, style = {}, ...rest }) => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: pad,
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-.01em' }}>{children}</h2>
      {action}
    </div>
  )
}

/* ── buttons ────────────────────────────────────────────── */

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: 'none',
  borderRadius: 'var(--r)',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'filter .18s, background .18s, transform .1s',
  lineHeight: 1.2,
}

const sizes = {
  sm: { padding: '9px 14px', fontSize: 13 },
  md: { padding: '13px 20px', fontSize: 14.5 },
  lg: { padding: '16px 24px', fontSize: 15.5 },
}

export function Button({ children, variant = 'primary', size = 'md', full, disabled, busy, style = {}, ...rest }) {
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--primary)' },
    danger: { background: 'var(--loss)', color: '#fff' },
    dangerGhost: { background: 'transparent', color: 'var(--loss)', border: '1px solid var(--loss)' },
  }
  return (
    <button
      disabled={disabled || busy}
      style={{
        ...btnBase,
        ...sizes[size],
        ...variants[variant],
        width: full ? '100%' : undefined,
        opacity: disabled || busy ? 0.6 : 1,
        cursor: busy ? 'wait' : disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ── status pill ────────────────────────────────────────── */

const TONES = {
  gain:    { fg: 'var(--gain)',  bg: 'var(--gain-soft)' },
  loss:    { fg: 'var(--loss)',  bg: 'var(--loss-soft)' },
  warn:    { fg: 'var(--warn)',  bg: 'var(--warn-soft)' },
  info:    { fg: 'var(--info)',  bg: 'var(--info-soft)' },
  brand:   { fg: 'var(--primary)', bg: 'var(--primary-soft)' },
  neutral: { fg: 'var(--text-3)', bg: 'var(--surface-2)' },
}

// Maps every status string used across the app to a tone.
export const toneFor = (status) => ({
  approved: 'gain', active: 'gain', verified: 'gain', completed: 'gain', confirmed: 'gain',
  pending: 'warn', processing: 'warn', submitted: 'warn', review: 'warn', in_review: 'warn',
  rejected: 'loss', failed: 'loss', cancelled: 'loss', closed: 'loss',
  new: 'brand', not_started: 'neutral', unverified: 'neutral', draft: 'neutral',
}[String(status || '').toLowerCase()] || 'neutral')

// Status values come from the database in snake_case English. Translate them
// here so every call site gets it for free.
const STATUS_KEYS = {
  pending: 'status.pending', approved: 'status.approved', rejected: 'status.rejected',
  active: 'status.active', submitted: 'status.submitted', new: 'status.new',
  sent: 'status.sent', replied: 'status.replied', verified: 'status.verified',
  not_started: 'status.notStarted',
}

export function Pill({ children, tone = 'neutral', status, icon, style = {} }) {
  const { t: translate } = useI18n()
  const tokens = TONES[status ? toneFor(status) : tone] || TONES.neutral
  const key = status && STATUS_KEYS[String(status).toLowerCase()]
  const label = children ?? (key ? translate(key) : status)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11.5,
        fontWeight: 700,
        padding: '4px 9px',
        borderRadius: 999,
        background: tokens.bg,
        color: tokens.fg,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon} {label}
    </span>
  )
}

/* ── empty state ────────────────────────────────────────── */

export function EmptyState({ icon, title, body, action, compact }) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '32px 20px' : '52px 24px' }}>
      {icon && (
        <div
          style={{
            width: 56, height: 56, margin: '0 auto 16px',
            borderRadius: '50%', background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ fontFamily: serif, fontSize: compact ? 19 : 23, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      {body && (
        <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 auto 20px', maxWidth: 380 }}>{body}</p>
      )}
      {action}
    </div>
  )
}

/* ── skeletons ──────────────────────────────────────────── */

export const SkeletonLine = ({ w = '100%', h = 14, style = {} }) => (
  <div data-skeleton style={{ width: w, height: h, ...style }} />
)

export function SkeletonCard({ rows = 3 }) {
  return (
    <Card>
      <SkeletonLine w="42%" h={12} style={{ marginBottom: 14 }} />
      <SkeletonLine w="68%" h={26} style={{ marginBottom: 18 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} w={i === rows - 1 ? '55%' : '100%'} h={12} style={{ marginBottom: 10 }} />
      ))}
    </Card>
  )
}

/* ── sheet / modal ──────────────────────────────────────── */

/** Centered dialog on desktop, bottom sheet on mobile (see dashboard.css). */
export function Sheet({ children, onClose, maxWidth = 460, labelledBy }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      data-sheet
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,20,15,.55)', backdropFilter: 'blur(4px)' }} />
      <div
        data-sheet-panel
        style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 24, boxShadow: 'var(--shadow-pop)',
          maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose, id }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
      <h2 id={id} style={{ fontFamily: serif, fontSize: 22, color: 'var(--text)', margin: 0, fontWeight: 400 }}>{title}</h2>
      <button
        type="button" onClick={onClose} aria-label="Close"
        style={{
          width: 36, height: 36, flex: 'none', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          color: 'var(--text-2)', fontSize: 16, cursor: 'pointer', lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}

/* ── form fields ────────────────────────────────────────── */

export const fieldStyle = {
  width: '100%',
  padding: '13px 14px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--surface-2)',
  outline: 'none',
  boxSizing: 'border-box',
}

export function Field({ label, hint, error, children, style = {} }) {
  return (
    <label style={{ display: 'block', marginBottom: 16, ...style }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{label}</span>
      {children}
      {hint && !error && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }}>{hint}</span>}
      {error && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--loss)', fontWeight: 600, marginTop: 5 }}>{error}</span>}
    </label>
  )
}

export function Alert({ tone = 'warn', children, style = {} }) {
  const t = TONES[tone] || TONES.warn
  return (
    <div
      role={tone === 'loss' ? 'alert' : undefined}
      style={{
        display: 'flex', gap: 10,
        background: t.bg,
        border: `1px solid color-mix(in srgb, ${t.fg} 28%, transparent)`,
        color: t.fg,
        borderRadius: 'var(--r)',
        padding: '12px 14px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.55,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── segmented control (filter chips) ───────────────────── */

export function Segmented({ tabs, active, onChange, style = {} }) {
  const items = tabs.map((t) => (Array.isArray(t) ? t : [t, t]))
  return (
    <div
      data-hscroll
      style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 4, borderRadius: 999, ...style }}
    >
      {items.map(([val, label]) => {
        const on = active === val
        return (
          <button
            key={val} type="button" onClick={() => onChange(val)}
            aria-pressed={on}
            style={{
              border: 'none',
              background: on ? 'var(--surface)' : 'transparent',
              color: on ? 'var(--primary)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 700,
              padding: '8px 14px', borderRadius: 999,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              boxShadow: on ? 'var(--shadow-sm)' : 'none',
              transition: 'background .18s, color .18s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── toast ──────────────────────────────────────────────── */

export function Toast({ message, tone = 'brand' }) {
  if (!message) return null
  const t = TONES[tone] || TONES.brand
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(var(--tabbar-h) + var(--safe-b) + 16px)',
        zIndex: 200,
        background: 'var(--text)',
        color: 'var(--surface)',
        padding: '13px 20px',
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: 'var(--shadow-pop)',
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center',
        animation: 'paneIn .24s ease',
        borderLeft: `3px solid ${t.fg}`,
      }}
    >
      {message}
    </div>
  )
}

/* ── icons (single stroke set, 24px grid) ───────────────── */

const ico = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    {p}
  </svg>
)

export const Icons = {
  home: ico(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>),
  wallet: ico(<><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M16 12.5h2.5" /><path d="M3 9.5h18" /></>),
  activity: ico(<><path d="M3 12h4l3 7 4-14 3 7h4" /></>),
  user: ico(<><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>),
  bell: ico(<><path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" /><path d="M10.5 19a2 2 0 0 0 3 0" /></>),
  users: ico(<><circle cx="9" cy="8" r="3.6" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.6 3.6 0 0 1 0 6.6" /><path d="M17.5 14.4A6.5 6.5 0 0 1 21.5 20" /></>),
  download: ico(<><path d="M12 3v12" /><path d="m7.5 11 4.5 4.5L16.5 11" /><path d="M4 20h16" /></>),
  up: ico(<><path d="M12 19V5" /><path d="m5.5 11.5 6.5-6.5 6.5 6.5" /></>),
  down: ico(<><path d="M12 5v14" /><path d="m5.5 12.5 6.5 6.5 6.5-6.5" /></>),
  check: ico(<><path d="m4.5 12.5 5 5 10-11" /></>),
  shield: ico(<><path d="M12 3l7.5 3v6c0 4.5-3 7.9-7.5 9.5C7.5 19.9 4.5 16.5 4.5 12V6Z" /><path d="m9 12 2 2 4-4.5" /></>),
  doc: ico(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>),
  camera: ico(<><path d="M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3Z" /><circle cx="12" cy="13.5" r="3.5" /></>),
  plans: ico(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></>),
  mail: ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>),
  chart: ico(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  settings: ico(<><circle cx="12" cy="12" r="3.2" /><path d="M19.5 12a7.5 7.5 0 0 0-.15-1.5l2-1.5-2-3.5-2.3 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.45 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.3-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.5 2.3-1a7.5 7.5 0 0 0 2.6 1.5L10 21.5h4l.45-2.5a7.5 7.5 0 0 0 2.6-1.5l2.3 1 2-3.5-2-1.5c.1-.5.15-1 .15-1.5Z" /></>),
  logout: ico(<><path d="M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" /><path d="M19 12H9" /><path d="m16 8.5 3.5 3.5L16 15.5" /></>),
  menu: ico(<><path d="M4 7h16M4 12h16M4 17h16" /></>),
  close: ico(<><path d="M6 6l12 12M18 6 6 18" /></>),
  plus: ico(<><path d="M12 5v14M5 12h14" /></>),
  arrowRight: ico(<><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>),
  clock: ico(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></>),
  info: ico(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>),
  sun: ico(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: ico(<><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5Z" /></>),
}

export const Icon = ({ name, size = 20, style = {}, ...rest }) => (
  <span style={{ width: size, height: size, display: 'inline-flex', flex: 'none', ...style }} {...rest}>
    {Icons[name] || null}
  </span>
)
