import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

// Appearance preferences are stored per account (keyed by user id) so one
// student switching to dark mode doesn't affect any other account signed in
// on the same browser, and logging back into the same account restores it.
const THEME_KEY_PREFIX = 'eschool_theme:'
const FONT_KEY_PREFIX = 'eschool_font_scale:'
const NOTIFICATIONS_KEY_PREFIX = 'eschool_notifications:'

function getStoredTheme(userId) {
  if (!userId) return 'light'
  return localStorage.getItem(THEME_KEY_PREFIX + userId) === 'dark' ? 'dark' : 'light'
}

function getStoredFontScale(userId) {
  if (!userId) return 'md'
  const stored = localStorage.getItem(FONT_KEY_PREFIX + userId)
  return stored === 'sm' || stored === 'lg' ? stored : 'md'
}

function getStoredNotifications(userId) {
  if (!userId) return false
  return localStorage.getItem(NOTIFICATIONS_KEY_PREFIX + userId) === '1'
}

function applyToDocument(theme, fontScale) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('font-scale-sm', fontScale === 'sm')
  root.classList.toggle('font-scale-lg', fontScale === 'lg')
}

const PreferencesContext = createContext(undefined)

export function PreferencesProvider({ children }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState(() => getStoredTheme(user?.id))
  const [fontScale, setFontScale] = useState(() => getStoredFontScale(user?.id))
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => getStoredNotifications(user?.id))

  // Reload this account's saved preferences whenever who's signed in changes
  // (login, logout, or switching accounts on the same browser).
  useEffect(() => {
    setTheme(getStoredTheme(user?.id))
    setFontScale(getStoredFontScale(user?.id))
    setNotificationsEnabled(getStoredNotifications(user?.id))
  }, [user?.id])

  useEffect(() => {
    applyToDocument(theme, fontScale)
  }, [theme, fontScale])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      if (user?.id) localStorage.setItem(THEME_KEY_PREFIX + user.id, next)
      return next
    })
  }, [user?.id])

  const updateFontScale = useCallback(
    (next) => {
      setFontScale(next)
      if (user?.id) localStorage.setItem(FONT_KEY_PREFIX + user.id, next)
    },
    [user?.id]
  )

  const updateNotificationsEnabled = useCallback(
    (next) => {
      setNotificationsEnabled(next)
      if (user?.id) localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + user.id, next ? '1' : '0')
    },
    [user?.id]
  )

  const value = {
    theme,
    toggleTheme,
    fontScale,
    setFontScale: updateFontScale,
    notificationsEnabled,
    setNotificationsEnabled: updateNotificationsEnabled,
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (ctx === undefined) throw new Error('usePreferences must be used within a PreferencesProvider')
  return ctx
}
