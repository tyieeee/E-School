import { useState } from 'react'

const SIZE = 140
const STROKE = 20
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 4

function buildSegments(breakdown) {
  let cursor = 0
  // Zero-count entries are dropped, not just given a zero-length dash — a
  // zero-length arc with a round linecap still paints a full stray dot at
  // its start point, which is exactly the floating blob bug this replaces.
  return breakdown
    .filter((t) => t.count > 0)
    .map((t) => {
      const dash = (t.pct / 100) * CIRCUMFERENCE
      const segment = { ...t, dash, offset: cursor }
      cursor += dash
      return segment
    })
}

export default function TypeDonutChart({ breakdown, labels, colors, total }) {
  const [hovered, setHovered] = useState(null)
  const segments = buildSegments(breakdown)

  const centerLabel = hovered
    ? { value: hovered.count, caption: labels[hovered.type] }
    : { value: total, caption: total === 1 ? 'report' : 'reports' }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90 drop-shadow-sm"
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth={STROKE} />
          {segments.map((seg) => {
            const isHovered = hovered?.type === seg.type
            const isDimmed = hovered && !isHovered
            return (
              <circle
                key={seg.type}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={colors[seg.type]}
                strokeWidth={isHovered ? STROKE + 4 : STROKE}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(seg.dash - GAP, 0)} ${CIRCUMFERENCE}`}
                strokeDashoffset={-seg.offset}
                opacity={isDimmed ? 0.35 : 1}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered(seg)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none text-gray-900">{centerLabel.value}</span>
          <span className="mt-0.5 truncate px-2 text-[10px] text-gray-400">{centerLabel.caption}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1">
        {breakdown.map((t) => {
          const isHovered = hovered?.type === t.type
          return (
            <div
              key={t.type}
              onMouseEnter={() => t.count > 0 && setHovered(t)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                isHovered ? 'bg-gray-50' : ''
              } ${t.count > 0 ? 'cursor-pointer' : ''}`}
            >
              <span className="flex items-center gap-2 font-semibold text-gray-700">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[t.type] }} />
                {labels[t.type]}
              </span>
              <span className="shrink-0 text-gray-400">
                {t.count} · {t.pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
