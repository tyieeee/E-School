import { createPortal } from 'react-dom'
import Button from './Button'

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  busy = false,
  error = '',
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        {error && <p className="mb-4 text-sm font-medium text-urgent-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
