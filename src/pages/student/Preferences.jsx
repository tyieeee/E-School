import { useState } from 'react'
import { Moon, Type, Bell, Info, Palette } from 'lucide-react'
import { usePreferences } from '../../context/PreferencesContext'
import Switch from '../../components/Switch'

const FONT_SCALE_OPTIONS = [
  { key: 'sm', label: 'A', size: 'text-xs' },
  { key: 'md', label: 'A', size: 'text-sm' },
  { key: 'lg', label: 'A', size: 'text-base' },
]

const TABS = [
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Preferences() {
  const { theme, toggleTheme, fontScale, setFontScale, notificationsEnabled, setNotificationsEnabled } =
    usePreferences()
  const [tab, setTab] = useState('appearance')

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="mb-4 flex items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
              tab === t.key
                ? 'border-brand-600 bg-brand-600 text-white shadow-brand-900/20'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
            }`}
          >
            <t.icon size={15} strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      <div data-tour="preferences-page" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        {tab === 'appearance' && (
          <>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Appearance</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Customize how E-School looks on your device.
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-5 dark:border-white/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Moon size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Switch between light and dark themes.
                </p>
              </div>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} />
            </div>

            <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5 dark:border-white/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Type size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Font Size</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Adjust the text size for better readability.
                </p>
                <div className="mt-3 flex gap-2">
                  {FONT_SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFontScale(opt.key)}
                      aria-label={`Font size ${opt.key}`}
                      aria-pressed={fontScale === opt.key}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border font-bold transition-colors ${opt.size} ${
                        fontScale === opt.key
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'notifications' && (
          <>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Manage how you receive updates and alerts.
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-5 dark:border-white/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Bell size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Allow Notifications</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Enable notifications to receive alerts and updates.
                </p>
              </div>
              <Switch checked={notificationsEnabled} onChange={setNotificationsEnabled} />
            </div>

            {notificationsEnabled ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-calm-200 bg-calm-50 p-4 text-sm text-calm-700 dark:border-calm-500/20 dark:bg-calm-500/10 dark:text-calm-300">
                <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>You&apos;ll get notified about new Inbox replies and school Announcements.</p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/20 dark:bg-yellow-500/10">
                <p className="flex items-center gap-2 text-sm font-bold text-yellow-800 dark:text-yellow-300">
                  <Info size={16} strokeWidth={2} />
                  Notifications Disabled
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400/90">
                  Enable &quot;Allow Notifications&quot; above so you don&apos;t miss Inbox replies or
                  Announcements.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
