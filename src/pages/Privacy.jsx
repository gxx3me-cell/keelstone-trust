import { Link } from 'react-router-dom'

const serif = "'DM Serif Display',serif"
const C = { ink: '#111018', body: '#3d3450', muted: '#8a829a', line: '#e8e3f0', surface: '#f8f6fc', primary: '#6d28d9' }

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly to us when you create an account, make a deposit, submit a withdrawal, or communicate with us. This includes: full name, email address, government-issued identification documents (for KYC), wallet addresses, transaction history, and any communications you send us. We also collect certain technical data automatically when you use the Platform, including IP address, browser type, device identifiers, and usage data.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to: operate and provide the Platform; process deposits and withdrawals; verify your identity and comply with applicable law; communicate with you about your account and our services; send performance reports and service updates; detect, prevent, and investigate fraud and security incidents; and improve the Platform and develop new features.`,
  },
  {
    title: '3. Identity Verification (KYC/AML)',
    body: `We are required by applicable regulations to verify the identity of our clients before providing investment services. This requires you to submit government-issued identification and, in some cases, proof of address. This information is processed by our verification partners and retained in accordance with applicable legal requirements.`,
  },
  {
    title: '4. Sharing of Information',
    body: `We do not sell, rent, or trade your personal information to third parties. We may share your information with: identity verification providers; payment processors and banking partners; regulatory authorities and law enforcement when required by law; professional advisors including lawyers and accountants; and service providers who assist in operating the Platform, subject to appropriate confidentiality obligations.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your personal information for as long as your account is active or as needed to provide services to you. We may also retain certain information for longer periods as required by law (typically 5–7 years for financial records) or as necessary to resolve disputes and enforce our agreements.`,
  },
  {
    title: '6. Security',
    body: `We implement industry-standard technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. These include bank-grade encryption, multi-factor authentication, access controls, and regular security audits. No method of transmission over the internet is 100% secure, however, and we cannot guarantee absolute security.`,
  },
  {
    title: '7. Cookies and Tracking',
    body: `We use cookies and similar tracking technologies to operate the Platform and collect usage information. Essential cookies are required for the Platform to function. Analytics cookies help us understand how the Platform is used. You may disable non-essential cookies through your browser settings, though this may affect functionality.`,
  },
  {
    title: '8. Your Rights',
    body: `Depending on your jurisdiction, you may have the right to: access the personal information we hold about you; correct inaccurate information; request deletion of your information; object to or restrict certain processing; and data portability. To exercise any of these rights, contact us at privacy@lumencapital.com. We will respond to verified requests within 30 days.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `The Platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected personal information from a child, we will take steps to delete that information as quickly as possible.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and, where appropriate, by email. Your continued use of the Platform after any changes indicates your acceptance of the updated policy.`,
  },
]

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: C.ink }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.line}`, padding: '18px clamp(18px,5vw,72px)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/uploads/kneelstone-logo.png" alt="Kneelstone Trust" style={{ width: 30, height: 30, objectFit: "contain", flex: "none" }} />
          <span style={{ fontFamily: serif, fontSize: 18, color: C.ink }}>Kneelstone Trust</span>
        </Link>
      </div>

      {/* Hero strip */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: 'clamp(40px,6vh,72px) clamp(18px,5vw,72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 11.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: C.primary, marginBottom: 14 }}>Legal</div>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(32px,4.5vw,54px)', lineHeight: 1.06, margin: '0 0 14px', color: C.ink }}>Privacy Policy</h1>
          <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Last updated: 1 July 2026 · This policy explains how we collect, use, and protect your information.</p>
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
            For privacy-related requests or questions, contact our Data Protection team at{' '}
            <a href="mailto:privacy@lumencapital.com" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>privacy@lumencapital.com</a>.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/terms" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Terms of Service →</Link>
            <Link to="/" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>← Back to Kneelstone Trust</Link>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '24px clamp(18px,5vw,72px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>© 2026 Kneelstone Trust. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 12.5 }}>
          <Link to="/terms" style={{ color: C.muted, textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
