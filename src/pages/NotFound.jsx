import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = { ink: '#111018', body: '#3d3450', muted: '#8a829a', line: '#e8e3f0', surface: '#f8f6fc', primary: '#6d28d9' }

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
        <img src="/uploads/kneelstone-logo.png" alt="Kneelstone Trust" style={{ width: 32, height: 32, objectFit: "contain", flex: "none" }} />
        <span style={{ fontFamily: serif, fontSize: 19, color: C.ink }}>Kneelstone Trust</span>
      </Link>

      <div style={{ fontFamily: serif, fontSize: 'clamp(72px,14vw,120px)', lineHeight: 1, color: C.line, marginBottom: 8 }}>404</div>
      <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(26px,3.5vw,40px)', margin: '0 0 14px', color: C.ink }}>Page not found</h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, maxWidth: 400, margin: '0 auto 36px' }}>
        The page you're looking for doesn't exist or has been moved. Try heading back to the homepage.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: '#fff', padding: '13px 24px', background: C.primary, borderRadius: 6 }}>
          <ArrowLeft size={15} weight="bold" /> Back to homepage
        </Link>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: 14.5, fontWeight: 600, color: C.body, padding: '13px 24px', border: `1px solid ${C.line}`, borderRadius: 6, background: '#fff' }}>
          Investor dashboard
        </Link>
      </div>
    </div>
  )
}
