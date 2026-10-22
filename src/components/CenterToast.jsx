import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const TONES = {
  success: { bg: 'bg-calm-600', icon: CheckCircle2 },
  error: { bg: 'bg-urgent-600', icon: AlertCircle },
}

export default function CenterToast({ toast, onDismiss, duration = 3500 }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [toast, duration, onDismiss])

  if (!toast) return null

  const tone = TONES[toast.type] ?? TONES.success
  const Icon = tone.icon

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`animate-toast-drop-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg ${tone.bg}`}
      >
        <Icon size={16} strokeWidth={2.25} className="shrink-0" />
        <span>{toast.message}</span>
      </div>
    </div>,
    document.body
  )
}
