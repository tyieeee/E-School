import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import PasswordInput from '../../components/PasswordInput'
import AuthSplitLayout from '../../components/AuthSplitLayout'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // The emailed link redirects here with a recovery session already
    // established by the Supabase client (it parses the URL hash on load).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setInvalid(true)
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Please choose a password that is at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setBusy(false)
      setError(pwError.message)
      return
    }

    await supabase.auth.signOut()
    setBusy(false)
    navigate('/login', { replace: true, state: { justReset: true } })
  }

  if (invalid) {
    return (
      <AuthSplitLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white lg:text-gray-900">Link expired</h2>
          <p className="mt-2 text-sm text-gray-400 lg:text-gray-500">
            This reset link is no longer valid. Request a new one from the sign in page.
          </p>
          <Button onClick={() => navigate('/forgot-password')} className="mt-6 w-full">
            Request a new link
          </Button>
        </div>
      </AuthSplitLayout>
    )
  }

  if (!ready) return null

  return (
    <AuthSplitLayout>
      <h2 className="text-center text-2xl font-bold text-white lg:text-left lg:text-gray-900">
        Set a new password
      </h2>
      <p className="mt-1 text-center text-sm text-gray-400 lg:text-left lg:text-gray-500">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-semibold text-gray-200 lg:text-gray-700"
          >
            New password
          </label>
          <PasswordInput
            id="password"
            variant="auth"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-semibold text-gray-200 lg:text-gray-700"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            variant="auth"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-400 lg:text-urgent-600">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-2 w-full shadow-lg shadow-brand-900/30">
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
