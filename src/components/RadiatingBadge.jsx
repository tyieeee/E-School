import logo from '../image/lgoo.png'

// Arc-shaped radiating rings around a circular logo badge — three
// concentric arcs each side, computed on a 300x300 viewBox centered at
// (150,150), leaving a gap between the badge edge and the innermost arc.
// Each radius pulses on a stagger so the rings read as an outward radar ping.
const ARC_RADII = [90, 120, 150]

function arcPath(radius, startDeg, endDeg) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const x1 = 150 + radius * Math.cos(toRad(startDeg))
  const y1 = 150 + radius * Math.sin(toRad(startDeg))
  const x2 = 150 + radius * Math.cos(toRad(endDeg))
  const y2 = 150 + radius * Math.sin(toRad(endDeg))
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
}

function Arc({ radius, startDeg, endDeg, index }) {
  return (
    <path
      d={arcPath(radius, startDeg, endDeg)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="animate-radiate"
      style={{
        '--peak': 0.85 - index * 0.18,
        animationDelay: `${index * 0.35}s`,
      }}
    />
  )
}

export default function RadiatingBadge({ size = 220, orbSize = 132 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full text-brand-400">
        {ARC_RADII.map((r, i) => (
          <Arc key={`top-${r}`} radius={r} startDeg={200} endDeg={340} index={i} />
        ))}
        {ARC_RADII.map((r, i) => (
          <Arc key={`bottom-${r}`} radius={r} startDeg={20} endDeg={160} index={i} />
        ))}
      </svg>

      <img
        src={logo}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-xl"
        style={{ width: orbSize, height: orbSize }}
      />
    </div>
  )
}
