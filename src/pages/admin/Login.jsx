import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import PasswordInput from '../../components/PasswordInput'
import AuthSplitLayout from '../../components/AuthSplitLayout'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setBusy(false)
      setError('Incorrect email or password.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setBusy(false)

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('This account is not an Admin account.')
      return
    }

    navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true })
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-center text-2xl font-bold text-white lg:text-left lg:text-gray-900">
        Admin sign in
      </h2>
      <p className="mt-1 text-center text-sm text-gray-400 lg:text-left lg:text-gray-500">
        E-School administration portal
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label
            htmlFor="admin-email"
            className="mb-1 block text-sm font-semibold text-gray-200 lg:text-gray-700"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 lg:text-gray-400"
            />
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-base text-white placeholder-gray-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 lg:border-gray-300 lg:bg-white lg:text-gray-900 lg:focus:border-brand-500 lg:focus:ring-0"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="mb-1 block text-sm font-semibold text-gray-200 lg:text-gray-700"
          >
            Password
          </label>
          <PasswordInput
            id="admin-password"
            variant="auth"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-400 lg:text-urgent-600">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-2 w-full shadow-lg shadow-brand-900/30">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
