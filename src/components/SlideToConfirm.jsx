import { useEffect, useRef, useState } from 'react'
import { Send, Check } from 'lucide-react'

const HANDLE_SIZE = 48
const HANDLE_MARGIN = 4
const COMPLETE_THRESHOLD = 0.85

export default function SlideToConfirm({
  label = 'Slide to submit',
  onComplete,
  disabled = false,
  resetSignal,
}) {
  const trackRef = useRef(null)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const maxXRef = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setDragX(0)
    setCompleted(false)
    draggingRef.current = false
  }, [resetSignal])

  function handlePointerDown(e) {
    if (disabled || completed) return
    const track = trackRef.current
    if (!track) return
    maxXRef.current = track.clientWidth - HANDLE_SIZE - HANDLE_MARGIN * 2
    startXRef.current = e.clientX - dragX
    draggingRef.current = true
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return
    const next = Math.max(0, Math.min(e.clientX - startXRef.current, maxXRef.current))
    setDragX(next)
  }

  function finishDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)

    if (maxXRef.current > 0 && dragX >= maxXRef.current * COMPLETE_THRESHOLD) {
      setDragX(maxXRef.current)
      setCompleted(true)
      onComplete?.()
    } else {
      setDragX(0)
    }
  }

  const progress = maxXRef.current > 0 ? dragX / maxXRef.current : 0

  return (
    <div
      ref={trackRef}
      className={`relative flex h-14 w-full items-center overflow-hidden rounded-full bg-brand-600 shadow-lg shadow-brand-900/30 transition-opacity ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-sm font-bold text-white"
        style={{ opacity: Math.max(0, 1 - progress * 1.6) }}
      >
        {label}
      </span>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          marginLeft: HANDLE_MARGIN,
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease-out',
          touchAction: 'none',
        }}
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-md ${
          disabled || completed ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {completed ? (
          <Check size={20} strokeWidth={2.5} />
        ) : (
          <Send size={19} strokeWidth={2.25} />
        )}
      </div>
    </div>
  )
}
