import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  Megaphone,
  Inbox,
  User,
  ChevronRight,
  HelpCircle,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTour } from '../context/TourContext'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import { getHelpHintSeen, markHelpHintSeen } from '../lib/helpHintSeen'
import UrgentWarningOverlay from './UrgentWarningOverlay'
import NotificationBell from './NotificationBell'
import TourOverlay from './TourOverlay'
import HelpHintOverlay from './HelpHintOverlay'

// Report sits in the middle and gets a raised, icon-only FAB treatment in
// the mobile bottom nav (see the JSX below) — it's the most important
// action in the app, so it's the one item that stands out from the rest.
const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/report', label: 'Report', icon: Megaphone },
  { to: '/settings', label: 'Profile', icon: User },
  { to: '/preferences', label: 'Settings', icon: SettingsIcon },
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
  const { user, profile } = useAuth()
  const unreadCount = useUnreadMessages()
  const { start: startTour } = useTour()
  const location = useLocation()
  const [showHelpHint, setShowHelpHint] = useState(false)

  // Point out the "?" button once on a new account's first dashboard visit,
  // so they know where to go if they have questions later.
  useEffect(() => {
    if (location.pathname !== '/dashboard' || !user?.id) return
    if (getHelpHintSeen(user.id)) return
    setShowHelpHint(true)
  }, [location.pathname, user?.id])

  function dismissHelpHint() {
    setShowHelpHint(false)
    markHelpHintSeen(user?.id)
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <UrgentWarningOverlay />
      <TourOverlay />
      <HelpHintOverlay active={showHelpHint} onDismiss={dismissHelpHint} />

      <header className="shrink-0 border-b border-gray-100 bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90 sm:px-6">
        <div className="flex items-center justify-between">
          <NavLink
            to="/settings"
            className="group -m-1 flex min-w-0 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5 dark:active:bg-white/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-brand-800 shadow-md ring-[3px] ring-brand-600 dark:bg-slate-800 dark:text-brand-300">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile?.full_name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{greeting()}</p>
              <p className="truncate text-base font-bold leading-tight text-gray-900 dark:text-white">
                {profile?.full_name || 'Student'}
              </p>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={2}
              className="shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
            />
          </NavLink>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-tour="header-help"
              onClick={() => {
                if (showHelpHint) dismissHelpHint()
                startTour()
              }}
              aria-label="Show app tutorial"
              title="Show app tutorial"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <HelpCircle size={20} strokeWidth={2} />
            </button>
            <span data-tour="header-notifications">
              <NotificationBell />
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:pl-52">
        <Outlet />
      </main>

      <nav className="relative z-20 shrink-0 border-t border-gray-100 bg-white/95 px-2 pb-2 pt-2 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 sm:hidden">
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) =>
            item.to === '/report' ? (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="-mt-7 flex flex-col items-center justify-self-center"
              >
                {({ isActive }) => (
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-brand-900/30 ring-4 ring-white transition-colors dark:ring-slate-900 ${
                      isActive ? 'bg-brand-700' : 'bg-brand-600'
                    }`}
                  >
                    <item.icon size={24} strokeWidth={2} className="text-white" />
                  </span>
                )}
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-self-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-brand-700 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                  }`
                }
              >
                <span className="relative">
                  <item.icon size={20} strokeWidth={2} />
                  {item.to === '/inbox' && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-urgent-600 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </span>
                {item.label}
              </NavLink>
            )
          )}
        </div>
      </nav>

      <aside className="hidden sm:block">
        <div className="fixed left-0 top-16 z-20 flex h-[calc(100%-4rem)] w-48 flex-col gap-1 border-r border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <span className="relative">
                <item.icon size={20} strokeWidth={2} />
                {item.to === '/inbox' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-urgent-600 ring-2 ring-white dark:ring-slate-900" />
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
