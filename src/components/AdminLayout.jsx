import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bell,
  Mail,
  AlertTriangle,
  LogOut,
  History,
  KeyRound,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUrgentWarning } from '../hooks/useUrgentWarning'
import NotificationBell from './NotificationBell'

const navGroups = [
  {
    label: null,
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/activity', label: 'Recent Activity', icon: History },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/students', label: 'Students', icon: Users },
      { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
      { to: '/admin/announcements', label: 'Announcements', icon: Bell },
      { to: '/admin/messages', label: 'Messages', icon: Mail },
      { to: '/admin/passcode-requests', label: 'Passcode Requests', icon: KeyRound },
    ],
  },
  {
    label: 'Safety',
    items: [{ to: '/admin/urgent-warning', label: 'Urgent Warning', icon: AlertTriangle }],
  },
  {
    label: 'Settings',
    items: [{ to: '/admin/profile', label: 'Profile', icon: UserCircle }],
  },
]

const flatNavItems = navGroups.flatMap((g) => g.items)

function initials(name) {
  if (!name) return 'A'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { warning } = useUrgentWarning()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white sm:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-sm font-bold text-brand-700 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(profile?.full_name)
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight text-gray-900">E-School</p>
            <p className="text-xs leading-tight text-gray-400">Admin Panel</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon size={18} strokeWidth={2} />
                    {item.label}
                    {item.to === '/admin/urgent-warning' && warning && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-urgent-500" />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <Link to="/admin/profile" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg hover:bg-gray-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(profile?.full_name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </Link>
            <button
              onClick={signOut}
              aria-label="Log out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-xs font-bold text-brand-700 shadow-sm">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile?.full_name)
              )}
            </div>
            <span className="text-sm font-bold text-gray-900">E-School Admin</span>
          </div>
          <div className="hidden sm:block" />
          <div className="flex items-center gap-3">
            <NotificationBell
              iconSize={18}
              buttonClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            />
            <button onClick={signOut} className="text-sm font-semibold text-gray-600 sm:hidden">
              Log out
            </button>
          </div>
        </header>

        {warning && (
          <div className="flex items-center justify-between gap-3 bg-urgent-600 px-4 py-2 text-sm font-semibold text-white sm:px-6">
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={2} />
              An Urgent Warning is currently active for all students.
            </span>
            <NavLink to="/admin/urgent-warning" className="underline">
              Manage
            </NavLink>
          </div>
        )}

        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 py-2 sm:hidden">
          {flatNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
