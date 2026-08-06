import { useId, useState } from 'react'

const PADDING = { top: 12, right: 12, bottom: 24, left: 28 }

function niceMax(value) {
  if (value <= 5) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

// Gradient-filled area chart: one series, hairline recessive gridlines, a
// hover crosshair + point + floating tooltip. No legend — one series, and
// the heading above already names what's plotted.
export default function MonthlyReportsChart({ data, width = 640, height = 200 }) {
  const [hovered, setHovered] = useState(null)
  const gradientId = useId()

  const innerWidth = width - PADDING.left - PADDING.right
  const innerHeight = height - PADDING.top - PADDING.bottom
  const maxValue = niceMax(Math.max(...data.map((d) => d.value), 1))

  const points = data.map((d, i) => ({
    ...d,
    x: PADDING.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth),
    y: PADDING.top + innerHeight - (maxValue === 0 ? 0 : (d.value / maxValue) * innerHeight),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + innerHeight} L ${points[0].x} ${PADDING.top + innerHeight} Z`

  const gridSteps = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Reports submitted per month"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridSteps.map((step) => {
          const y = PADDING.top + innerHeight * (1 - step)
          const value = Math.round(maxValue * step)
          return (
            <g key={step}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray={step === 0 ? undefined : '3 4'}
              />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[9px]">
                {value}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="var(--color-brand-600)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered !== null && (
          <line
            x1={points[hovered].x}
            x2={points[hovered].x}
            y1={PADDING.top}
            y2={PADDING.top + innerHeight}
            stroke="var(--color-brand-300)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {points.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 4 : 3}
              fill="white"
              stroke="var(--color-brand-600)"
              strokeWidth={2}
              className="transition-all"
            />
            <rect
              x={p.x - innerWidth / data.length / 2}
              y={PADDING.top}
              width={innerWidth / data.length}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-500 text-[10px] font-medium"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(points[hovered].x / width) * 100}%`,
            top: `${(Math.max(points[hovered].y - 10, PADDING.top) / height) * 100}%`,
          }}
        >
          <p className="font-semibold text-gray-900">{points[hovered].label}</p>
          <p className="text-gray-500">
            {points[hovered].value} {points[hovered].value === 1 ? 'report' : 'reports'}
          </p>
        </div>
      )}
    </div>
  )
}
