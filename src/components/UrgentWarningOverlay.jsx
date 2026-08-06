import { AlertTriangle } from 'lucide-react'
import { useUrgentWarning } from '../hooks/useUrgentWarning'

// Full-screen, unmissable alert. Students cannot dismiss it — only an
// Admin deactivating the warning clears it for everyone in real time.
export default function UrgentWarningOverlay() {
  const { warning } = useUrgentWarning()

  if (!warning) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-urgent-600 animate-urgent-pulse p-6 text-center text-white">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
        <AlertTriangle size={44} strokeWidth={2} />
      </div>
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Urgent Alert</h1>
      <p className="max-w-xl text-lg font-medium sm:text-2xl">{warning.message}</p>
      <p className="mt-8 text-sm font-medium text-red-100">
        Follow your school's safety procedures. This alert will clear automatically once the
        situation is resolved.
      </p>
    </div>
  )
}
