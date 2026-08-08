import { Link } from 'react-router-dom'
import { Megaphone, Inbox, Bell, Lock, ShieldCheck } from 'lucide-react'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import AnnouncementCard from '../../components/AnnouncementCard'
import { useAuth } from '../../context/AuthContext'
import { getAnnouncementsSeenAt } from '../../lib/announcementsSeen'

const quickActions = [
  { to: '/my-reports', label: 'My Reports', icon: Lock },
  { to: '/report', label: 'Report', icon: Megaphone },
  { to: '/inbox', label: 'My Inbox', icon: Inbox },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const { announcements, loading } = useAnnouncements()
  const visible = announcements.slice(0, 3)

  const seenAt = getAnnouncementsSeenAt(user?.id)
  const unseenCount = seenAt
    ? announcements.filter((a) => new Date(a.created_at) > new Date(seenAt)).length
    : announcements.length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-900/25 ring-1 ring-white/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-4 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <ShieldCheck
          size={150}
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-8 -right-8 text-white/10"
        />

        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
          <ShieldCheck size={13} strokeWidth={2.5} />
          E-School
        </span>

        <h1 className="relative mt-3 text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
          Welcome to E-School
        </h1>
        <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-white/85">
          Your safe space to report concerns, get updates, and stay connected with your school.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {quickActions.map((item) => (
          <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 shadow-md shadow-brand-900/10 transition-colors hover:bg-brand-100">
              <item.icon size={24} strokeWidth={2} />
            </span>
            <span className="text-xs font-semibold text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <Bell size={16} strokeWidth={2.25} />
            </span>
            Announcements
          </h2>
          {unseenCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-urgent-600 px-1 text-[10px] font-bold text-white">
              {unseenCount}
            </span>
          )}
        </div>
        {announcements.length > 0 && (
          <Link
            to="/announcements"
            className="shrink-0 text-sm font-bold text-brand-800 hover:text-brand-900"
          >
            View All
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {!loading && announcements.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400 shadow-sm">
          No announcements yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visible.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </div>
  )
}
