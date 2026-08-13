import { useEffect, useState } from 'react'

// Tracks the on-screen position/size of the element matching
// `[data-tour="<targetId>"]`, used to draw a spotlight cutout around it.
// Retries until the element mounts, then keeps re-measuring via
// ResizeObserver so the spotlight stays correct even if the target's
// content (and therefore its size) settles after an async fetch.
export function useTargetRect(targetId, active) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!active || !targetId) {
      setRect(null)
      return undefined
    }

    let cancelled = false
    let attempts = 0
    let observer = null

    function measure(el) {
      if (!cancelled) setRect(el.getBoundingClientRect())
    }

    function locate() {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${targetId}"]`)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        measure(el)
        observer = new ResizeObserver(() => measure(el))
        observer.observe(el)
      } else if (attempts < 20) {
        attempts += 1
        setTimeout(locate, 50)
      }
    }
    locate()

    function reposition() {
      const el = document.querySelector(`[data-tour="${targetId}"]`)
      if (el) measure(el)
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [targetId, active])

  return rect
}
