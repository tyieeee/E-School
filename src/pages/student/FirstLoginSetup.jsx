import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Check, Circle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Card from '../../components/Card'
import GoogleIcon from '../../components/GoogleIcon'

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { key: 'symbol', label: 'One symbol (e.g. !@#$%)', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

function Required() {
  return (
    <span className="text-urgent-600" aria-hidden="true">
      {' '}
      *
    </span>
  )
}

const STEPS = [
  { label: 'Password', description: "Choose a new password to replace the one your Admin set." },
  { label: 'Contact', description: 'Share a contact number so your Admin can reach you.' },
  { label: 'Gmail', description: "Add a Gmail address so you can recover your account if you get locked out." },
]

export default function FirstLoginSetup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isLastStep = step === STEPS.length - 1

  function goNext(e) {
    e.preventDefault()
    setError('')

    if (step === 0) {
      if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
        setError('Please meet all password requirements below.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    if (step === 1 && !/^\d{11}$/.test(contactNumber)) {
      setError('Please enter an 11-digit contact number (e.g. 09171234567).')
      return
    }

    setStep((s) => s + 1)
  }

  function goBack() {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!GMAIL_RE.test(contactEmail.trim())) {
      setError('Please enter a valid Gmail address (e.g. you@gmail.com).')
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
          <p className="mt-1 text-sm text-gray-500">{STEPS[step].description}</p>
        </div>

        <div className="mb-1.5 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="mb-6 text-center text-xs font-semibold text-gray-400">
          Step {step + 1} of {STEPS.length} · {STEPS[step].label}
        </p>

        <form onSubmit={isLastStep ? handleSubmit : goNext} className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>
                  New password
                  <Required />
                </span>
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
                />
              </label>

              <ul className="-mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password)
                  return (
                    <li
                      key={rule.key}
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        met ? 'text-calm-600' : 'text-gray-400'
                      }`}
                    >
                      {met ? (
                        <Check size={13} strokeWidth={2.5} className="shrink-0" />
                      ) : (
                        <Circle size={13} strokeWidth={2} className="shrink-0" />
                      )}
                      {rule.label}
                    </li>
                  )
                })}
              </ul>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>
                  Confirm password
                  <Required />
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
                />
              </label>
            </>
          )}

          {step === 1 && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              <span>
                Contact number
                <Required />
              </span>
              <input
                type="tel"
                required
                autoFocus
                inputMode="numeric"
                maxLength={11}
                placeholder="e.g. 09171234567"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
              />
            </label>
          )}

          {step === 2 && (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>
                  Gmail address
                  <Required />
                </span>
                <div className="relative">
                  <GoogleIcon
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="you@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-base focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </label>
              <p className="-mt-2 text-xs font-normal text-gray-400">
                We&apos;ll use this to send a password reset link if you ever get locked out.
              </p>
            </>
          )}

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <div className="mt-2 flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <Button type="submit" disabled={busy} className="flex-1">
              {isLastStep ? (busy ? 'Saving…' : 'Save and continue') : 'Next'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
