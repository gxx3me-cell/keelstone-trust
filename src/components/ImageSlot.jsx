import { SLOT_IMAGES } from '../slots'

// Hard rule: real images must always have sharp edges (no border radius).
// `shape="circle"` is still honored for avatar-style placeholders, but actual
// photographs render with 0 radius regardless of the shape passed in.
const radiusForShape = (shape, radius) => {
  if (shape === 'circle') return '50%'
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
          ...style,
          // sharp edges always win, even over an incoming style override
          borderRadius: shape === 'circle' ? '50%' : 0,
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
          'linear-gradient(135deg, rgba(109,40,217,.38), rgba(192,38,211,.28))',
        borderRadius,
        ...style,
      }}
    >
      {placeholder}
    </div>
  )
}
