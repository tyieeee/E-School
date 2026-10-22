import { useEffect, useState } from 'react'
import { Lock, ShieldAlert, CircleAlert, LifeBuoy, ClipboardList, MapPin, HelpCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { hashPasscode } from '../../lib/passcode'
import Button from '../../components/Button'
import PinInput from '../../components/PinInput'

const TYPE_LABELS = { bullying: 'Bullying', weapon: 'Weapon Sighting', other: 'Other Safety Concern' }
const TYPE_ICONS = { bullying: CircleAlert, weapon: ShieldAlert, other: LifeBuoy }
const TYPE_TONES = {
  bullying: 'bg-orange-50 text-orange-600',
  weapon: 'bg-urgent-50 text-urgent-600',
  other: 'bg-calm-50 text-calm-600',
}
const STATUS_COLORS = {
  new: 'bg-brand-50 text-brand-800',
  reviewing: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-calm-100 text-calm-600',
  escalated: 'bg-urgent-100 text-urgent-700',
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function MyReports() {
  const { user, profile, refreshProfile } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [requestingReset, setRequestingReset] = useState(false)

  const hasPasscode = Boolean(profile?.reports_passcode_hash)
  const resetRequested = Boolean(profile?.passcode_reset_requested_at)

  useEffect(() => {
    if (!unlocked || !user) return
    let active = true
    setLoadingReports(true)
    supabase
      .from('reports')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setReports(data ?? [])
          setLoadingReports(false)
        }
      })
    return () => {
      active = false
    }
  }, [unlocked, user])

  async function handleSetPasscode(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Passcode must be 4–6 digits.')
      return
    }
    if (pin !== confirmPin) {
      setError('Passcodes do not match.')
      return
    }
    setBusy(true)
    const hash = await hashPasscode(pin)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ reports_passcode_hash: hash })
      .eq('id', user.id)
    setBusy(false)
    if (updateError) {
      setError('Could not save your passcode. Please try again.')
      return
    }
    await refreshProfile()
    setPin('')
    setConfirmPin('')
    setUnlocked(true)
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const hash = await hashPasscode(pin)
    setBusy(false)
    if (hash !== profile.reports_passcode_hash) {
      setError('Incorrect passcode.')
      setPin('')
      return
    }
    setPin('')
    setUnlocked(true)
  }

  async function requestPasscodeReset() {
    if (!user) return
    setRequestingReset(true)
    await supabase
      .from('profiles')
      .update({ passcode_reset_requested_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    setRequestingReset(false)
  }

  if (!profile) return null

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm">
        <div data-tour="my-reports-passcode">
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Lock size={22} strokeWidth={2} className="text-brand-800 dark:text-brand-400" />
            My Reports
          </h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {hasPasscode
              ? 'Enter your passcode to view the reports you have submitted.'
              : "Set a passcode so no one else can see the reports you've submitted, even if they pick up your phone."}
          </p>

          <form onSubmit={hasPasscode ? handleUnlock : handleSetPasscode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {hasPasscode ? 'Passcode' : 'Create a passcode'}
              <PinInput value={pin} onChange={setPin} autoFocus />
            </div>

            {!hasPasscode && (
              <div className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirm passcode
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>
            )}

            {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : hasPasscode ? 'Unlock' : 'Save passcode'}
            </Button>
          </form>
        </div>

        {hasPasscode && (
          <div className="mt-4 text-center">
            {resetRequested ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Request sent — your Admin will send a reset through your Inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={requestPasscodeReset}
                disabled={requestingReset}
                className="text-xs font-semibold text-gray-400 underline decoration-dotted hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {requestingReset ? 'Sending…' : 'Forgot your passcode? Ask your Admin for help.'}
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-400 dark:ring-white/10">
            <HelpCircle size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">How My Reports works</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-900/70 dark:text-brand-100/70">
              Your passcode keeps your submitted reports hidden from anyone else who picks up your
              phone — not even your Admin sets or sees it. Forgot it? Your Admin can reset it and
              will notify you through your Inbox.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <ClipboardList size={22} strokeWidth={2} className="text-brand-800 dark:text-brand-400" />
          My Reports
        </h1>
        <button
          onClick={() => setUnlocked(false)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <Lock size={14} strokeWidth={2} />
          Lock
        </button>
      </div>

      {loadingReports && <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>}
      {!loadingReports && reports.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-gray-500">
          You haven't submitted any reports yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((r) => {
          const TypeIcon = TYPE_ICONS[r.type] ?? LifeBuoy
          return (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      TYPE_TONES[r.type] ?? 'bg-brand-50 text-brand-800'
                    }`}
                  >
                    <TypeIcon size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{TYPE_LABELS[r.type] ?? r.type}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.created_at)}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{r.description}</p>
              {r.location && (
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <MapPin size={12} strokeWidth={2} />
                  {r.location}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
