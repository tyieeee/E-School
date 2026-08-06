import { useEffect, useState } from 'react'
import { KeyRound, Clock, Send, User } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import ConfirmModal from '../../components/ConfirmModal'

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function PasscodeRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .not('passcode_reset_requested_at', 'is', null)
      .order('passcode_reset_requested_at', { ascending: true })
    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function confirmSend() {
    setBusy(true)
    await supabase
      .from('profiles')
      .update({ reports_passcode_hash: null, passcode_reset_requested_at: null })
      .eq('id', pending.id)
    await supabase.from('direct_messages').insert({
      student_id: pending.id,
      sender_id: user.id,
      message: 'Your My Reports passcode has been reset. Open Profile → My Reports Passcode to set a new one.',
    })
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'reset_reports_passcode',
      details: `Reset ${pending.full_name}'s My Reports passcode`,
    })
    setBusy(false)
    setPending(null)
    load()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Passcode Reset Requests"
        description="Students who forgot their My Reports passcode land here — send them a reset through their Inbox."
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-md">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <KeyRound size={22} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-tight">{requests.length}</p>
            <p className="text-sm text-white/80">pending {requests.length === 1 ? 'request' : 'requests'}</p>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && requests.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-gray-400">
          <KeyRound size={28} strokeWidth={1.5} className="text-gray-300" />
          No pending passcode reset requests.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {requests.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : s.full_name ? (
                  initials(s.full_name)
                ) : (
                  <User size={16} strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{s.full_name || 'Unknown student'}</p>
                <p className="truncate text-xs text-gray-500">
                  #{s.student_number || '—'} · {s.contact_number || 'No contact number'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                <Clock size={12} strokeWidth={2} />
                Requested {timeAgo(s.passcode_reset_requested_at)}
              </span>
              <button
                onClick={() => setPending(s)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                <Send size={14} strokeWidth={2.25} />
                Send reset passcode
              </button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={!!pending}
        title="Reset this student's My Reports passcode?"
        description={`${pending?.full_name} will need to set a new passcode next time they open My Reports. They'll be notified through their Inbox.`}
        confirmLabel="Send reset passcode"
        onConfirm={confirmSend}
        onCancel={() => setPending(null)}
        busy={busy}
      />
    </div>
  )
}
