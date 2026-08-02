/* Keelstone Trust — internationalisation.
 *
 * A deliberately small implementation: no dependency, ~2KB, and it does the
 * four things this app actually needs — lookup with interpolation, locale
 * detection, persistence (localStorage + profile), and RTL.
 *
 * Usage:
 *   const { t, locale, setLocale, dir } = useI18n()
 *   t('nav.signIn')                        → "Sign in"
 *   t('deposit.min', { amount: '$5,000' }) → "Minimum $5,000"
 *
 * Missing keys fall back to English, then to the key itself, so a half-finished
 * translation degrades to readable English rather than blank UI.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import pt from './locales/pt'
import it from './locales/it'
import ar from './locales/ar'
import zh from './locales/zh'
import ja from './locales/ja'
import ko from './locales/ko'
import tr from './locales/tr'
import ru from './locales/ru'

export const LOCALES = {
  en: { name: 'English',    native: 'English',   flag: '🇬🇧', dir: 'ltr' },
  es: { name: 'Spanish',    native: 'Español',   flag: '🇪🇸', dir: 'ltr' },
  fr: { name: 'French',     native: 'Français',  flag: '🇫🇷', dir: 'ltr' },
  de: { name: 'German',     native: 'Deutsch',   flag: '🇩🇪', dir: 'ltr' },
  pt: { name: 'Portuguese', native: 'Português', flag: '🇵🇹', dir: 'ltr' },
  it: { name: 'Italian',    native: 'Italiano',  flag: '🇮🇹', dir: 'ltr' },
  ar: { name: 'Arabic',     native: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  zh: { name: 'Chinese',    native: '简体中文',    flag: '🇨🇳', dir: 'ltr' },
  ja: { name: 'Japanese',   native: '日本語',      flag: '🇯🇵', dir: 'ltr' },
  ko: { name: 'Korean',     native: '한국어',      flag: '🇰🇷', dir: 'ltr' },
  tr: { name: 'Turkish',    native: 'Türkçe',    flag: '🇹🇷', dir: 'ltr' },
  ru: { name: 'Russian',    native: 'Русский',   flag: '🇷🇺', dir: 'ltr' },
}

const CATALOGUES = { en, es, fr, de, pt, it, ar, zh, ja, ko, tr, ru }

export const LOCALE_CODES = Object.keys(LOCALES)
const STORAGE_KEY = 'keelstone-locale'
const DEFAULT_LOCALE = 'en'

/* ── detection ──────────────────────────────────────────── */

/** Pick the best supported locale for this browser. */
export function detectLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && CATALOGUES[stored]) return stored
  } catch { /* storage blocked */ }

  try {
    // navigator.languages is ordered by preference; 'pt-BR' → 'pt'.
    for (const tag of navigator.languages || [navigator.language]) {
      if (!tag) continue
      const base = tag.toLowerCase().split('-')[0]
      if (CATALOGUES[base]) return base
    }
  } catch { /* no navigator */ }

  return DEFAULT_LOCALE
}

/* ── lookup ─────────────────────────────────────────────── */

// Catalogues are nested objects; keys are dotted paths.
function resolve(catalogue, key) {
  let node = catalogue
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** Replace {name} placeholders. Values are inserted as plain text. */
function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function translate(locale, key, vars) {
  const hit =
    resolve(CATALOGUES[locale] || {}, key) ??
    resolve(CATALOGUES[DEFAULT_LOCALE], key)
  // Falling back to the key keeps the UI debuggable instead of blank.
  return interpolate(hit ?? key, vars)
}

/* ── context ────────────────────────────────────────────── */

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale)

  const dir = LOCALES[locale]?.dir || 'ltr'

  // Keep <html lang/dir> correct: screen readers, hyphenation, and the CSS
  // logical properties all key off these.
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  // Adopt the signed-in user's saved locale, unless they've already chosen one
  // explicitly in this browser (localStorage wins for the current session).
  useEffect(() => {
    let active = true
    const sync = async (session) => {
      if (!session?.user) return
      let explicit = null
      try { explicit = localStorage.getItem(STORAGE_KEY) } catch {}
      if (explicit) return
      const { data } = await supabase
        .from('profiles').select('locale').eq('id', session.user.id).maybeSingle()
      if (active && data?.locale && CATALOGUES[data.locale]) setLocaleState(data.locale)
    }
    supabase.auth.getSession().then(({ data }) => sync(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => sync(session))
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const setLocale = useCallback(async (next) => {
    if (!CATALOGUES[next]) return
    setLocaleState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}

    // Persist to the profile so it follows the user to other devices.
    // Non-blocking: a failure here must never break switching language.
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await supabase.from('profiles').update({ locale: next }).eq('id', data.session.user.id)
      }
    } catch { /* offline or signed out — localStorage still holds it */ }
  }, [])

  const value = useMemo(() => ({
    locale,
    setLocale,
    dir,
    isRTL: dir === 'rtl',
    t: (key, vars) => translate(locale, key, vars),
    locales: LOCALES,
  }), [locale, setLocale, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/* ── locale-aware formatting ────────────────────────────── */

/** Currency, formatted for the active locale. Always USD — the platform's unit. */
export function useMoney() {
  const { locale } = useI18n()
  return useCallback((n, dp = 2) =>
    Number(n || 0).toLocaleString(locale, {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    }), [locale])
}

/** Dates and relative times in the active locale. */
export function useDates() {
  const { locale, t } = useI18n()

  const shortDate = useCallback((iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  }, [locale])

  const timeAgo = useCallback((iso) => {
    if (!iso) return ''
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) return ''
    const secs = Math.floor((Date.now() - then) / 1000)
    if (secs < 60) return t('time.justNow')
    const mins = Math.floor(secs / 60)
    if (mins < 60) return t('time.minutesAgo', { n: mins })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('time.hoursAgo', { n: hrs })
    const days = Math.floor(hrs / 24)
    if (days < 7) return t('time.daysAgo', { n: days })
    return shortDate(iso)
  }, [locale, t, shortDate])

  return { shortDate, timeAgo }
}
