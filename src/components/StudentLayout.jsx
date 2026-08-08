import { NavLink, Outlet } from 'react-router-dom'
import { Home, Megaphone, Inbox, User, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import UrgentWarningOverlay from './UrgentWarningOverlay'
import NotificationBell from './NotificationBell'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/report', label: 'Report', icon: Megaphone },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/settings', label: 'Profile', icon: User },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(name) {
  if (!name) return 'S'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function StudentLayout() {
  const { profile } = useAuth()
  const unreadCount = useUnreadMessages()

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-50">
      <UrgentWarningOverlay />

      <header className="shrink-0 border-b border-gray-100 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between">
          <NavLink
            to="/settings"
            className="group -m-1 flex min-w-0 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-brand-800 ring-[3px] ring-brand-600">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile?.full_name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">{greeting()}</p>
              <p className="truncate text-base font-bold leading-tight text-gray-900">
                {profile?.full_name || 'Student'}
              </p>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={2}
              className="shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </NavLink>
          <NotificationBell />
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:pl-52">
        <Outlet />
      </main>

      <nav className="shrink-0 border-t border-gray-100 bg-white/95 px-2 pb-2 pt-2 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <span className="relative">
                <item.icon size={20} strokeWidth={2} />
                {item.to === '/inbox' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-urgent-600 ring-2 ring-white" />
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="hidden sm:block">
        <div className="fixed left-0 top-16 z-20 flex h-[calc(100%-4rem)] w-48 flex-col gap-1 border-r border-gray-100 bg-white p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-brand-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="relative">
                <item.icon size={20} strokeWidth={2} />
                {item.to === '/inbox' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-urgent-600 ring-2 ring-white" />
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>
    </div>
  )
}
