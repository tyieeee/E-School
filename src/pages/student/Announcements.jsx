import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ArrowLeft } from 'lucide-react'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import AnnouncementCard from '../../components/AnnouncementCard'
import { useAuth } from '../../context/AuthContext'
import { markAnnouncementsSeen } from '../../lib/announcementsSeen'

export default function Announcements() {
  const { user } = useAuth()
  const { announcements, loading } = useAnnouncements()

  useEffect(() => {
    if (user?.id) markAnnouncementsSeen(user.id)
  }, [user?.id])

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Back
      </Link>

      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
          <Bell size={18} strokeWidth={2.25} />
        </span>
        Announcements
      </h1>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {!loading && announcements.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400 shadow-sm">
          No announcements yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </div>
  )
}
