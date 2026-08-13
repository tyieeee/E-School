import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Card from '../../components/Card'
import GoogleIcon from '../../components/GoogleIcon'
import PasswordInput from '../../components/PasswordInput'
import BrandMark from '../../components/BrandMark'

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

export default function FirstLoginSetup() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Admin-triggered password resets already carry a contact number and Gmail
  // on file — only genuinely new accounts need the full setup wizard.
  const steps = useMemo(() => {
    const list = [
      { key: 'password', label: 'Password', description: "Choose a new password to replace the one your Admin set." },
    ]
    if (!profile?.contact_number) {
      list.push({ key: 'contact', label: 'Contact', description: 'Share a contact number so your Admin can reach you.' })
    }
    if (!profile?.contact_email) {
      list.push({ key: 'gmail', label: 'Gmail', description: "Add a Gmail address so you can recover your account if you get locked out." })
    }
    return list
  }, [profile?.contact_number, profile?.contact_email])

  const isLastStep = step === steps.length - 1
  const isMultiStep = steps.length > 1
  const currentKey = steps[step].key
  const gmailInvalid = contactEmail.trim().length > 0 && !GMAIL_RE.test(contactEmail.trim())

  const metRulesCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  const strengthPct = password ? (metRulesCount / PASSWORD_RULES.length) * 100 : 0
  const strengthLabel = !password
    ? 'Enter a password'
    : metRulesCount === PASSWORD_RULES.length
      ? 'Strong'
      : metRulesCount >= PASSWORD_RULES.length - 1
        ? 'Good'
        : metRulesCount >= PASSWORD_RULES.length / 2
          ? 'Fair'
          : 'Weak'
  const strengthColor =
    metRulesCount === PASSWORD_RULES.length
      ? 'bg-calm-600'
      : metRulesCount >= PASSWORD_RULES.length - 1
        ? 'bg-brand-600'
        : metRulesCount >= PASSWORD_RULES.length / 2
          ? 'bg-yellow-500'
          : 'bg-urgent-500'

  function goNext(e) {
    e.preventDefault()
    setError('')

    if (currentKey === 'password') {
      if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
        setError('Please meet all password requirements below.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    if (currentKey === 'contact' && !/^\d{10}$/.test(contactNumber)) {
      setError('Please enter a 10-digit contact number (e.g. 9171234567).')
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

    const hasGmailStep = steps.some((s) => s.key === 'gmail')
    if (hasGmailStep && !GMAIL_RE.test(contactEmail.trim())) {
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

    const updates = { must_change_password: false }
    if (steps.some((s) => s.key === 'contact')) updates.contact_number = contactNumber.trim()
    if (hasGmailStep) updates.contact_email = contactEmail.trim() || null

    const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', user.id)

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
      <BrandMark className="fixed left-4 top-4 z-20" />
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <UserCheck size={28} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {isMultiStep ? "Welcome! Let's finish setting up your account." : 'Reset your password'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{steps[step].description}</p>
        </div>

        {isMultiStep && (
          <>
            <div className="mb-1.5 flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div
                  key={s.label}
                  className={`relative h-1.5 flex-1 overflow-hidden rounded-full transition-colors ${
                    i <= step ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                >
                  {i === step && (
                    <div className="absolute inset-y-0 left-0 w-1/3 animate-step-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  )}
                </div>
              ))}
            </div>
            <p className="mb-6 text-center text-xs font-semibold text-gray-400">
              Step {step + 1} of {steps.length} · {steps[step].label}
            </p>
          </>
        )}

        <form onSubmit={isLastStep ? handleSubmit : goNext} className={`flex flex-col gap-4 ${isMultiStep ? '' : 'mt-6'}`}>
          {currentKey === 'password' && (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>
                  New password
                  <Required />
                </span>
                <PasswordInput
                  id="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <div className="-mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${strengthPct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-gray-500">{strengthLabel}</span>
                </div>

                <ul className="mt-3 flex flex-col gap-1.5">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password)
                    const Icon = met ? CheckCircle2 : XCircle
                    return (
                      <li
                        key={rule.key}
                        className={`flex items-center gap-2 text-xs font-medium ${
                          met ? 'text-calm-600' : 'text-gray-400'
                        }`}
                      >
                        <Icon size={16} strokeWidth={2} className="shrink-0" />
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                <span>
                  Confirm password
                  <Required />
                </span>
                <PasswordInput
                  id="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </>
          )}

          {currentKey === 'contact' && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              <span>
                Contact number
                <Required />
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 focus-within:border-brand-500">
                <span className="text-base font-semibold text-gray-500">+63</span>
                <span className="h-5 w-px bg-gray-300" />
                <input
                  type="tel"
                  required
                  autoFocus
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9171234567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full min-w-0 border-none bg-transparent p-0 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </label>
          )}

          {currentKey === 'gmail' && (
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
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-base focus:outline-none ${
                      gmailInvalid
                        ? 'border-urgent-400 focus:border-urgent-500'
                        : 'border-gray-300 focus:border-brand-500'
                    }`}
                  />
                </div>
              </label>
              {gmailInvalid ? (
                <p className="-mt-2 text-xs font-medium text-urgent-600">
                  Only @gmail.com addresses are accepted.
                </p>
              ) : (
                <p className="-mt-2 text-xs font-normal text-gray-400">
                  We&apos;ll use this to send a password reset link if you ever get locked out.
                </p>
              )}
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
