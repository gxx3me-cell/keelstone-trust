/**
 * Shown instead of React Router's raw stack trace when a route throws.
 *
 * Wired up two ways, because they catch different things:
 *   * `errorElement` on each route — render errors inside that route, plus
 *     loader/action failures and 404s.
 *   * <ErrorBoundary> around the router — anything thrown above the routes,
 *     e.g. in a provider.
 *
 * Deliberately plain: no data fetching, no i18n, no shared UI kit. Whatever
 * broke may be the very thing this page would depend on, so it uses only
 * literal strings and inline styles.
 */
import React from 'react'
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'

const SUPPORT_EMAIL = 'contact@keelstone-trust.com'

const C = {
  ink: '#0f1b16',
  body: '#3d4c45',
  muted: '#6b7d73',
  brand: '#137045',
  line: '#dde5e0',
  canvas: '#f4f7f5',
}
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif"

/** A short code the investor can quote to support. Not an identifier of theirs. */
function referenceCode() {
  const d = new Date()
  const stamp = d.toISOString().slice(5, 16).replace(/[-:T]/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `KT-${stamp}-${rand}`
}

export function ErrorScreen({ error, reference, onRetry }) {
  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const ref = reference ?? referenceCode()

  // Surfaced only in development. In production this text could leak table
  // names and query shapes, which is free reconnaissance for an attacker.
  const detail = import.meta.env.DEV
    ? (error?.stack || error?.message || String(error ?? ''))
    : null

  return (
    <div
      style={{
        minHeight: '100vh', background: C.canvas, fontFamily: FONT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
          <div style={{ width: 34, height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/uploads/kneelstone-logo.png" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>Keelstone Trust</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted }}>
              Investor Portal
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff', border: `1px solid ${C.line}`,
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <div style={{ height: 3, background: C.brand }} />
          <div style={{ padding: '30px 30px 26px' }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-.3px' }}>
              {isNotFound ? 'We couldn’t find that page' : 'Something went wrong on our end'}
            </h1>

            <p style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.65, color: C.body }}>
              {isNotFound
                ? 'The page you’re looking for doesn’t exist or has moved. Your account and funds are unaffected.'
                : 'This part of the portal failed to load. Your account, balances and any pending requests are safe and unaffected — nothing was lost.'}
            </p>

            {!isNotFound && (
              <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.65, color: C.body }}>
                Try again in a moment. If it keeps happening, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Portal%20error%20${ref}`} style={{ color: C.brand, fontWeight: 600 }}>
                  {SUPPORT_EMAIL}
                </a>{' '}
                and quote the reference below — it helps us find exactly what failed.
              </p>
            )}

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: isNotFound ? 0 : 22 }}>
              <button
                type="button"
                onClick={onRetry ?? (() => window.location.reload())}
                style={{
                  padding: '12px 22px', border: 'none', borderRadius: 6, background: C.brand,
                  color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Try again
              </button>
              <Link
                to="/dashboard"
                style={{
                  padding: '12px 22px', border: `1px solid ${C.line}`, borderRadius: 6,
                  background: '#fff', color: C.ink, fontSize: 14.5, fontWeight: 600,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                }}
              >
                Back to dashboard
              </Link>
            </div>

            {!isNotFound && (
              <div
                style={{
                  background: C.canvas, borderRadius: 8, padding: '12px 14px',
                  fontSize: 12.5, color: C.muted,
                }}
              >
                Reference{' '}
                <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', color: C.ink, fontWeight: 600 }}>
                  {ref}
                </span>
              </div>
            )}

            {detail && (
              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
                  Developer details (dev build only)
                </summary>
                <pre
                  style={{
                    marginTop: 10, padding: 12, background: '#0f1b16', color: '#c8e6d5',
                    borderRadius: 8, fontSize: 11.5, lineHeight: 1.5, overflowX: 'auto',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}
                >
                  {detail}
                </pre>
              </details>
            )}
          </div>
        </div>

        <p style={{ margin: '18px 4px 0', fontSize: 12, lineHeight: 1.6, color: C.muted }}>
          Need help with your account? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.muted }}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  )
}

/** Route-level handler: React Router hands us the error via this hook. */
export default function ErrorPage() {
  const error = useRouteError()

  React.useEffect(() => {
    // Kept so the failure is visible in the browser console and in any
    // monitoring that hooks console.error.
    console.error('Route error:', error)
  }, [error])

  return <ErrorScreen error={error} />
}

/**
 * Class boundary for anything thrown outside the router's reach — a provider,
 * or a child that errors during an event handler's render pass.
 * React still requires a class for componentDidCatch.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, reference: null }
  }

  static getDerivedStateFromError(error) {
    return { error, reference: referenceCode() }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <ErrorScreen
        error={this.state.error}
        reference={this.state.reference}
        onRetry={() => this.setState({ error: null, reference: null })}
      />
    )
  }
}
