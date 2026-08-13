import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTour } from '../context/TourContext'
import { usePreferences } from '../context/PreferencesContext'
import { useTargetRect } from '../hooks/useTargetRect'

const PADDING = 6
const TOOLTIP_HEIGHT_ESTIMATE = 200

export default function TourOverlay() {
  const { active, step, stepIndex, total, next, back, finish } = useTour()
  const { theme } = usePreferences()
  const rect = useTargetRect(step?.target, active)

  // Blocking pointer events on the overlay only stops new clicks — an
  // autoFocused field (like the passcode PIN boxes) already has keyboard
  // focus the instant its page mounts, so typing would still reach it
  // unless we actively steal focus back for as long as the tour is up.
  useEffect(() => {
    if (!active) return undefined
    document.activeElement?.blur?.()

    function stealFocus(e) {
      if (e.target && e.target !== document.body) e.target.blur()
    }
    document.addEventListener('focusin', stealFocus)
    return () => document.removeEventListener('focusin', stealFocus)
  }, [active])

  if (!active || !step) return null

  const spotlightStyle = rect && {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  // Most targets are small enough that the tooltip can sit just below (or,
  // if there's no room, above) them. But a "whole page" intro step spotlights
  // a target tall enough to fill most of the screen — there's no above/below
  // that doesn't overlap it, so those fall back to a bottom-anchored sheet.
  const isOversizedTarget = rect ? rect.height > window.innerHeight * 0.55 : false
  let tooltipTop = null
  if (rect && !isOversizedTarget) {
    const fitsBelow = rect.bottom + PADDING + 12 + TOOLTIP_HEIGHT_ESTIMATE < window.innerHeight
    tooltipTop = fitsBelow
      ? rect.bottom + PADDING + 12
      : Math.max(16, rect.top - PADDING - 12 - TOOLTIP_HEIGHT_ESTIMATE)
  }

  // The spotlight "cutout" comes entirely from this one box-shadow (a huge
  // spread that darkens everything outside the box, leaving the box itself
  // untouched) plus a bright ring drawn in the same shadow. Dark mode needs
  // a stronger backdrop since the page underneath is already dark; light
  // mode uses a lighter backdrop so it doesn't crush to near-black.
  const backdropAlpha = theme === 'dark' ? 0.78 : 0.45
  const spotlightShadow = `0 0 0 3px rgba(255,255,255,0.95), 0 0 24px 4px rgba(255,255,255,0.35), 0 0 0 9999px rgba(0,0,0,${backdropAlpha})`

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Blocks all clicks/typing on the real page underneath, everywhere —
          including inside the spotlighted area, which is only visually
          "cut out" via the box-shadow trick below, not actually interactive. */}
      <div
        className="absolute inset-0 transition-opacity"
        style={spotlightStyle ? undefined : { backgroundColor: `rgba(0,0,0,${backdropAlpha})` }}
      />

      {spotlightStyle && (
        <div
          className="pointer-events-none absolute rounded-2xl transition-all duration-300"
          style={{ ...spotlightStyle, boxShadow: spotlightShadow }}
        />
      )}

      <div
        className={`absolute inset-x-4 mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 ${
          tooltipTop === null ? 'bottom-20 sm:bottom-6' : ''
        }`}
        style={tooltipTop === null ? undefined : { top: tooltipTop }}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Step {stepIndex + 1} of {total}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Close tutorial"
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">{step.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.description}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-semibold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              {stepIndex + 1 === total ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
