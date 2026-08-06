import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Card from '../../components/Card'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FirstLoginSetup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
    if (!contactNumber.trim()) {
      setError('Please enter a contact number so your Admin can reach you if needed.')
      return
    }
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) {
      setError('Please enter a valid email address, or leave it blank.')
      return
    }

    setBusy(true)

    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setBusy(false)
      setError(pwError.message)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        contact_number: contactNumber.trim(),
        contact_email: contactEmail.trim() || null,
        must_change_password: false,
      })
      .eq('id', user.id)

    setBusy(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    await refreshProfile()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <UserCheck size={28} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome! Let's finish setting up your account.</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a new password and share a contact number so your Admin can reach you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            New password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Confirm password
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Contact number
            <input
              type="tel"
              required
              placeholder="e.g. 09171234567"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Email (optional)
            <input
              type="email"
              placeholder="you@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? 'Saving…' : 'Save and continue'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
