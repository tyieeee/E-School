import { Pin } from 'lucide-react'

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AnnouncementCard({ announcement }) {
  return (
    <div
      className={`relative rounded-2xl border p-5 shadow-sm transition-colors ${
        announcement.pinned
          ? 'border-brand-200 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10'
          : 'border-gray-100 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-white/5'
      }`}
    >
      {announcement.pinned && (
        <span
          className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-urgent-600 shadow-md ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-white/10"
          aria-label="Pinned"
        >
          <Pin size={14} strokeWidth={2.5} className="-rotate-45" fill="currentColor" />
        </span>
      )}
      <h3 className="mb-1 font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{announcement.message}</p>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{formatDate(announcement.created_at)}</p>
    </div>
  )
}
