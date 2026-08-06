import { useId } from 'react'

// Arc-shaped radiating rings (top + bottom) around a shield-shaped badge —
// three concentric arcs each side, computed on a 300x300 viewBox centered
// at (150,150), leaving a gap between the shield edge and the innermost arc.
// Each radius pulses on a stagger so the rings read as an outward radar ping.
const ARC_RADII = [90, 120, 150]
const SHIELD_PATH = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'

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

export default function RadiatingBadge({ size = 220, orbSize = 132, children }) {
  const gradientId = useId()

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

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: orbSize, height: orbSize }}
      >
        <svg viewBox="-2.5 -2.5 29 29" className="h-full w-full drop-shadow-2xl">
          <defs>
            <radialGradient id={gradientId} cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor="var(--color-brand-400)" />
              <stop offset="55%" stopColor="var(--color-brand-600)" />
              <stop offset="100%" stopColor="var(--color-brand-700)" />
            </radialGradient>
          </defs>
          <path d={SHIELD_PATH} fill={`url(#${gradientId})`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pb-[10%]">
          {children}
        </div>
      </div>
    </div>
  )
}
