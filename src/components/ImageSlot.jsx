import { SLOT_IMAGES } from '../slots'

const radiusForShape = (shape, radius) => {
  if (shape === 'circle') return '50%'
  if (shape === 'rounded') return `${radius || 16}px`
  return '0'
}

/**
 * Mirrors the original <image-slot> custom element. If an image was saved for
 * the given id it is rendered; otherwise a soft gradient placeholder with the
 * placeholder label is shown.
 */
export default function ImageSlot({ id, shape = 'rect', radius, placeholder = '', style = {} }) {
  const src = SLOT_IMAGES[id]
  const borderRadius = radiusForShape(shape, radius)

  if (src) {
    return (
      <img
        src={src}
        alt={placeholder || id}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius,
          ...style,
        }}
      />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '12px',
        color: 'rgba(255,255,255,.7)',
        fontSize: '13px',
        fontWeight: 600,
        background:
          'linear-gradient(135deg, rgba(124,58,237,.35), rgba(236,72,153,.3))',
        borderRadius,
        ...style,
      }}
    >
      {placeholder}
    </div>
  )
}
