// Kneelstone Trust brand mark.
//
// <Logo size={36} />            → just the emblem
// <Logo size={36} withName />   → emblem + "Kneelstone Trust"
// <Logo size={36} withName sub="Investor Portal" light /> → for dark backgrounds

const LOGO_SRC = '/uploads/kneelstone-logo.png'
const serif = "'DM Serif Display',serif"

export default function Logo({
  size = 36,
  withName = false,
  sub,
  light = false,
  nameSize,
  gap = 11,
  style,
}) {
  const nameColor = light ? '#fff' : 'var(--text, #0a0612)'
  const subColor = light ? 'rgba(255,255,255,.55)' : 'var(--text-3, #7c728f)'
  const ns = nameSize || Math.round(size * 0.56)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}>
      <img
        src={LOGO_SRC}
        alt="Kneelstone Trust"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', flex: 'none' }}
      />
      {withName && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontFamily: serif, fontSize: ns, color: nameColor, whiteSpace: 'nowrap' }}>
            Kneelstone <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Trust</span>
          </span>
          {sub && (
            <span style={{ fontSize: Math.max(9, Math.round(ns * 0.42)), color: subColor, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>
              {sub}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
