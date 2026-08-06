import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown } from 'lucide-react'

const DELTA_TONES = {
  positive: 'text-calm-600',
  negative: 'text-urgent-600',
  neutral: 'text-gray-400',
}

// Flat, icon-free tile: label, a large number, and an optional trend line.
// Only pass `delta` when there's a real prior-period figure behind it —
// no invented percentages.
export default function StatCard({ label, value, delta, deltaTone = 'positive', to, linkLabel }) {
  const content = (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="truncate text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold leading-none text-gray-900">{value}</p>
      {delta && (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${DELTA_TONES[deltaTone]}`}>
          {deltaTone === 'positive' && <ArrowUp size={11} strokeWidth={2.5} />}
          {deltaTone === 'negative' && <ArrowDown size={11} strokeWidth={2.5} />}
          {delta}
        </p>
      )}
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} aria-label={linkLabel} className="block">
      {content}
    </Link>
  )
}
