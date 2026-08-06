import { X } from 'lucide-react'

export default function Toast({ open, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="animate-fade-in-up relative rounded-2xl border border-gray-200 bg-white p-4 pr-10 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={15} strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>
  )
}
