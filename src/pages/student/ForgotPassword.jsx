import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import AuthSplitLayout from '../../components/AuthSplitLayout'
import GoogleIcon from '../../components/GoogleIcon'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: fnError } = await supabase.functions.invoke('request-password-reset', {
      body: { email: email.trim(), redirectTo: `${window.location.origin}/reset-password` },
    })
    setBusy(false)
    if (fnError) {
      setError('Something went wrong sending your request. Please try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthSplitLayout>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <MailCheck size={28} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            If that matches an account on file, we&apos;ve sent a password reset link to that
            account&apos;s login email — not the Gmail address you just entered. Open it to set
            a new password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to sign in
          </Link>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-center text-2xl font-bold text-gray-900 lg:text-left">
        Forgot your password?
      </h2>
      <p className="mt-1 text-center text-sm text-gray-500 lg:text-left">
        Enter the Gmail address saved on your account (not your login email) — we&apos;ll use it
        to find your account and email a reset link to your login address.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
            Gmail address
          </label>
          <div className="relative">
            <GoogleIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-base text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-2 w-full shadow-lg shadow-brand-900/30">
          {busy ? 'Sending…' : 'Send request'}
        </Button>

        <Link
          to="/login"
          className="text-center text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          Back to sign in
        </Link>
      </form>
    </AuthSplitLayout>
  )
}
