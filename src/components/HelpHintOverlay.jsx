import { X } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { useTargetRect } from '../hooks/useTargetRect'

const PADDING = 6
const TOOLTIP_HEIGHT_ESTIMATE = 140

// A single, one-time spotlight on the "?" tutorial button — shown once on
// a new account's first dashboard visit so they know it's there, without
// launching the full guided tour.
export default function HelpHintOverlay({ active, onDismiss }) {
  const { theme } = usePreferences()
  const rect = useTargetRect('header-help', active)

  if (!active) return null

  const spotlightStyle = rect && {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  const fitsBelow = rect ? rect.bottom + PADDING + 12 + TOOLTIP_HEIGHT_ESTIMATE < window.innerHeight : true
  const tooltipTop = rect
    ? fitsBelow
      ? rect.bottom + PADDING + 12
      : Math.max(16, rect.top - PADDING - 12 - TOOLTIP_HEIGHT_ESTIMATE)
    : null

  const backdropAlpha = theme === 'dark' ? 0.78 : 0.45
  const spotlightShadow = `0 0 0 3px rgba(255,255,255,0.95), 0 0 24px 4px rgba(255,255,255,0.35), 0 0 0 9999px rgba(0,0,0,${backdropAlpha})`

  return (
    <div className="fixed inset-0 z-[60]">
      {!spotlightStyle && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{ backgroundColor: `rgba(0,0,0,${backdropAlpha})` }}
        />
      )}

      {spotlightStyle && (
        <div
          className="pointer-events-none absolute rounded-full transition-all duration-300"
          style={{ ...spotlightStyle, boxShadow: spotlightShadow }}
        />
      )}

      <div
        className="absolute inset-x-4 mx-auto max-w-xs rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        style={tooltipTop === null ? { top: '20%' } : { top: tooltipTop }}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Need help?</h3>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Tap this button anytime you have a question — it walks you through how the app works.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
