/* Language picker.
 *
 * Two presentations, one behaviour:
 *   variant="menu" — compact dropdown for the landing nav and dashboard topbars
 *   variant="list" — full-width rows for the Account settings screen
 *
 * The button shows the CURRENT language in its own script ("Français", "日本語"),
 * which is the convention that lets someone who can't read the interface find
 * their language.
 */

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

export default function LanguageSwitcher({ variant = 'menu', compact = false, style = {} }) {
  const { locale, setLocale, locales, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const entries = Object.entries(locales)

  /* ── list variant: settings screen ── */
  if (variant === 'list') {
    return (
      <div role="radiogroup" aria-label={t('common.language')} style={style}>
        {entries.map(([code, meta]) => {
          const on = code === locale
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setLocale(code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '13px 16px', border: 'none', borderTop: '1px solid var(--border)',
                background: on ? 'var(--primary-soft)' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
                color: 'var(--text)',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, flex: 'none' }}>{meta.flag}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: on ? 700 : 600 }}>{meta.native}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{meta.name}</span>
              </span>
              {on && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <path d="m4.5 12.5 5 5 10-11" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  /* ── menu variant: nav / topbar ── */
  const current = locales[locale]

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('common.language')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: compact ? '8px 10px' : '9px 13px',
          border: '1px solid var(--border, #e8e3f0)',
          borderRadius: 999,
          background: 'var(--surface, #fff)',
          color: 'var(--text-2, #3d3450)',
          fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{current?.flag}</span>
        {!compact && <span>{current?.native}</span>}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flex: 'none', opacity: .6 }}
        >
          <path d="m5 9 7 7 7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            insetInlineEnd: 0,          // flips automatically under RTL
            zIndex: 200,
            minWidth: 190,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e8e3f0)',
            borderRadius: 14,
            boxShadow: '0 18px 44px rgba(17,16,24,.18)',
            padding: 6,
          }}
        >
          {entries.map(([code, meta]) => {
            const on = code === locale
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { setLocale(code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 11px', border: 'none', borderRadius: 9,
                  background: on ? 'var(--primary-soft, #f1ecfd)' : 'transparent',
                  color: on ? 'var(--primary, #6d28d9)' : 'var(--text-2, #3d3450)',
                  fontSize: 13.5, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, flex: 'none' }}>{meta.flag}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{meta.native}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
