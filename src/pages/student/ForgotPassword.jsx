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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-brand-400 lg:bg-brand-100 lg:text-brand-600">
            <MailCheck size={28} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-white lg:text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-400 lg:text-gray-500">
            If that matches an account on file, we&apos;ve sent a password reset link to that
            account&apos;s login email — not the Gmail address you just entered. Open it to set
            a new password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300 lg:text-brand-600 lg:hover:text-brand-700"
          >
            Back to sign in
          </Link>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-center text-2xl font-bold text-white lg:text-left lg:text-gray-900">
        Forgot your password?
      </h2>
      <p className="mt-1 text-center text-sm text-gray-400 lg:text-left lg:text-gray-500">
        Enter the Gmail address saved on your account (not your login email) — we&apos;ll use it
        to find your account and email a reset link to your login address.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-semibold text-gray-200 lg:text-gray-700"
          >
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
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-base text-white placeholder-gray-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 lg:border-gray-300 lg:bg-white lg:text-gray-900 lg:focus:border-brand-500 lg:focus:ring-0"
            />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-400 lg:text-urgent-600">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-2 w-full shadow-lg shadow-brand-900/30">
          {busy ? 'Sending…' : 'Send request'}
        </Button>

        <Link
          to="/login"
          className="text-center text-sm font-semibold text-gray-400 hover:text-gray-200 lg:text-gray-500 lg:hover:text-gray-700"
        >
          Back to sign in
        </Link>
      </form>
    </AuthSplitLayout>
  )
}
