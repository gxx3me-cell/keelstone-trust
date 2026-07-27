// A branded full-screen splash / loading screen for Kneelstone Trust.
// The green emblem glows on a deep backdrop with a soft float + shimmer.
//
// <BrandSplash />                     → default "loading" splash
// <BrandSplash label="Verifying…" />  → custom caption
// <BrandSplash static />              → no loading bar (pure brand hero)

const serif = "'DM Serif Display',serif"

export default function BrandSplash({ label = 'Loading your portfolio', static: isStatic = false }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 60% 50% at 50% 42%, #12211a 0%, #0a0f0d 55%, #060807 100%)',
        color: '#fff',
        padding: 24,
      }}
    >
      {/* keyframes (scoped, injected once) */}
      <style>{`
        @keyframes ks-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ks-glow { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.08)} }
        @keyframes ks-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(320%)} }
        @keyframes ks-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>

      {/* soft green aura behind the mark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,214,127,.28) 0%, rgba(52,214,127,0) 68%)',
          filter: 'blur(6px)',
          animation: 'ks-glow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* emblem */}
      <div style={{ position: 'relative', animation: 'ks-float 5s ease-in-out infinite' }}>
        <img
          src="/uploads/kneelstone-logo.png"
          alt="Kneelstone Trust"
          style={{ width: 132, height: 132, objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(52,214,127,.35))' }}
        />
      </div>

      {/* wordmark */}
      <div style={{ textAlign: 'center', animation: 'ks-fade .6s ease both', animationDelay: '.15s' }}>
        <div style={{ fontFamily: serif, fontSize: 30, letterSpacing: '-.01em', lineHeight: 1 }}>
          Kneelstone <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#34d67f' }}>Trust</span>
        </div>
        <div style={{ fontSize: 11.5, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)', fontWeight: 700, marginTop: 10 }}>
          Private Digital Wealth
        </div>
      </div>

      {/* loading bar */}
      {!isStatic && (
        <div style={{ width: 180, marginTop: 6, textAlign: 'center', animation: 'ks-fade .6s ease both', animationDelay: '.3s' }}>
          <div style={{ position: 'relative', height: 3, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '30%',
                borderRadius: 3,
                background: 'linear-gradient(90deg, transparent, #34d67f, transparent)',
                animation: 'ks-bar 1.15s ease-in-out infinite',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 14 }}>{label}</div>
        </div>
      )}
    </div>
  )
}
