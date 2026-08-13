import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import PasswordInput from '../../components/PasswordInput'
import AuthSplitLayout from '../../components/AuthSplitLayout'
import LoginTransition from '../../components/LoginTransition'

const TRANSITION_MS = 2800

export default function StudentLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    localStorage.setItem('sb-remember-me', rememberMe ? 'true' : 'false')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError('That email or password is not right. Ask your Admin if you need help.')
      return
    }
    setSignedIn(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), TRANSITION_MS)
  }

  if (signedIn) return <LoginTransition />

  return (
    <AuthSplitLayout>
      <h2 className="text-center text-2xl font-bold text-gray-900 lg:text-left">
        Sign in to E-School
      </h2>
      <p className="mt-1 text-center text-sm text-gray-500 lg:text-left">
        Use the account your Admin set up for you.
      </p>

      {location.state?.justReset && (
        <p className="mt-4 rounded-xl border border-calm-200 bg-calm-50 px-4 py-2.5 text-center text-sm font-medium text-calm-700">
          Password updated. Sign in with your new password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-base text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex select-none items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 bg-white text-brand-600 focus:ring-brand-500"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

        <Button
          type="submit"
          disabled={busy}
          className="mt-2 w-full shadow-lg shadow-brand-900/30"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
