import { Link } from 'react-router-dom'
import { Vault } from '@phosphor-icons/react'

const serif = "'DM Serif Display',serif"
const C = { ink: '#111018', body: '#3d3450', muted: '#8a829a', line: '#e8e3f0', surface: '#f8f6fc', primary: '#6d28d9' }

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the Lumen platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform. These Terms constitute a legally binding agreement between you ("User", "Client", "you") and Lumen ("Company", "we", "us", "our").`,
  },
  {
    title: '2. Description of Services',
    body: `Lumen provides professionally managed digital asset portfolio services. Our investment team allocates and manages client capital across our defined strategies — Growth, Balanced, Conservative, and Private Mandate — on the client's behalf. We do not provide personalised financial advice, and nothing on this Platform should be construed as such.`,
  },
  {
    title: '3. Eligibility',
    body: `You must be at least 18 years of age to use the Platform. By accessing the Platform, you represent and warrant that you meet this requirement. You further represent that you are not subject to any sanctions or restrictions that would prohibit you from using our services. Lumen reserves the right to refuse service to anyone at any time.`,
  },
  {
    title: '4. Account Registration',
    body: `To access our investment services, you must create an account and complete our identity verification process. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.`,
  },
  {
    title: '5. Investment Risk Disclosure',
    body: `Digital assets are highly volatile instruments that carry substantial risk. The value of your portfolio may decrease as well as increase. Past performance is not indicative of future results. Capital invested through the Lumen Platform is not guaranteed. Target annual return figures represent historical strategy performance and are not guaranteed. You should not invest more than you can afford to lose.`,
  },
  {
    title: '6. Fees & Charges',
    body: `Lumen charges a management fee based on assets under management. Fee schedules are disclosed at account opening and within your investor dashboard. We reserve the right to modify fees with thirty (30) days written notice. Continued use of the Platform after such notice constitutes acceptance of the revised fee structure.`,
  },
  {
    title: '7. Deposits & Withdrawals',
    body: `Deposits are accepted in USDT (BEP-20) and other supported digital assets as disclosed within the Platform. Withdrawals are processed within 3–5 business days. Lumen reserves the right to impose withdrawal limits and processing times at its discretion. Requests that cannot be verified may be delayed or declined.`,
  },
  {
    title: '8. Prohibited Activities',
    body: `You agree not to use the Platform for any unlawful purpose or in any way that violates these Terms. Prohibited activities include, but are not limited to: money laundering, terrorist financing, fraud, identity theft, unauthorised access to the Platform or other accounts, and using the Platform to process funds from illegal activities.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content, features, and functionality available through the Platform — including but not limited to text, graphics, logos, and software — are owned by Lumen or its licensors and are protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, Lumen shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform. Our total aggregate liability to you shall not exceed the total fees paid by you in the twelve (12) months preceding the event giving rise to the claim.`,
  },
  {
    title: '11. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will notify you of material changes via email or a prominent notice on the Platform. Your continued use of the Platform after the effective date of any changes constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Platform.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under or in connection with these Terms shall be subject to binding arbitration. Nothing in this section prevents either party from seeking injunctive or other equitable relief from a court of competent jurisdiction.`,
  },
]

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: C.ink }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.line}`, padding: '18px clamp(18px,5vw,72px)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Vault size={16} color="#fff" weight="duotone" />
          </div>
          <span style={{ fontFamily: serif, fontSize: 18, color: C.ink }}>Lumen</span>
        </Link>
      </div>

      {/* Hero strip */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: 'clamp(40px,6vh,72px) clamp(18px,5vw,72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 11.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: C.primary, marginBottom: 14 }}>Legal</div>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.5vw,54px)', lineHeight: 1.06, margin: '0 0 14px', color: C.ink }}>Terms of Service</h1>
          <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Last updated: 1 July 2026 · Please read these terms carefully before using the Lumen Platform.</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(36px,6vw,72px) clamp(18px,5vw,72px)' }}>
        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${C.line}` }}>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 22, margin: '0 0 12px', color: C.ink }}>{s.title}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.8, color: C.body, margin: 0 }}>{s.body}</p>
          </div>
        ))}

        <div style={{ background: C.surface, border: `1px solid ${C.line}`, padding: '28px 32px', marginTop: 12 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.body, margin: '0 0 16px' }}>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@lumencapital.com" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>legal@lumencapital.com</a>.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ fontSize: 14, fontWeight: 600, color: C.primary, textDecoration: 'none' }}>Privacy Policy →</Link>
            <Link to="/" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>← Back to Lumen</Link>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '24px clamp(18px,5vw,72px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>© 2026 Lumen. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 12.5 }}>
          <Link to="/terms" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
          <Link to="/privacy" style={{ color: C.muted, textDecoration: 'none' }}>Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
