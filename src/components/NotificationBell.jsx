import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell({
  iconSize = 20,
  buttonClassName = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700',
}) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  function handleItemClick(n) {
    if (!n.read) markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={`relative ${buttonClassName}`}
      >
        <Bell size={iconSize} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-urgent-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div className="fixed right-4 top-16 z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:right-6">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-gray-400">
                    <Bell size={24} strokeWidth={1.5} className="text-gray-300" />
                    No notifications yet.
                  </div>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      n.read ? '' : 'bg-brand-50/40'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-600'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
