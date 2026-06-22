import { useEffect } from 'react'

/**
 * Re-implements the original [data-reveal] scroll animation: elements start
 * faded/translated and animate in when they enter the viewport. Honors an
 * optional data-delay attribute (in ms).
 */
export function useReveal(ref) {
  useEffect(() => {
    const root = ref?.current || document
    const els = Array.from(root.querySelectorAll('[data-reveal]'))
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10)
      el.style.opacity = '0'
      el.style.transform = 'translateY(46px)'
      el.style.transition = `opacity .9s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms`
      el.style.willChange = 'opacity, transform'
    })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1'
            e.target.style.transform = 'none'
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ref])
}

/** Re-implements [data-anim] simple mount fade used by the auth pages. */
export function useAnim(ref) {
  useEffect(() => {
    const root = ref?.current || document
    const els = Array.from(root.querySelectorAll('[data-anim]'))
    els.forEach((el) => {
      const d = parseInt(el.getAttribute('data-delay') || '0', 10)
      el.style.opacity = '0'
      el.style.transform = 'translateY(28px)'
      el.style.transition = `opacity .8s cubic-bezier(.16,1,.3,1) ${d}ms, transform .8s cubic-bezier(.16,1,.3,1) ${d}ms`
    })
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        els.forEach((el) => {
          el.style.opacity = '1'
          el.style.transform = 'none'
        })
      }),
    )
  }, [ref])
}

/** Re-implements [data-count] count-up animation on first visibility. */
export function useCountUp(ref) {
  useEffect(() => {
    const root = ref?.current || document
    const counters = Array.from(root.querySelectorAll('[data-count]'))
    const animate = (el) => {
      const target = parseFloat(el.getAttribute('data-count'))
      const dec = parseInt(el.getAttribute('data-dec') || '0', 10)
      const dur = 1500
      const start = performance.now()
      const fmt = (v) =>
        dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = fmt(target * eased)
        if (p < 1) requestAnimationFrame(step)
        else el.textContent = fmt(target)
      }
      requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.6 },
    )
    counters.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ref])
}
