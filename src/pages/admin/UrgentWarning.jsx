import { useEffect, useState } from 'react'
import { AlertTriangle, History, ShieldCheck, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useUrgentWarning } from '../../hooks/useUrgentWarning'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmModal from '../../components/ConfirmModal'

const DEFAULT_MESSAGE = 'URGENT: School Alert — please follow staff instructions immediately.'

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function UrgentWarning() {
  const { user } = useAuth()
  const { warning } = useUrgentWarning()
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])

  async function loadHistory() {
    const { data } = await supabase
      .from('audit_log')
      .select('id, action, details, created_at, actor:profiles(full_name)')
      .in('action', ['trigger_urgent_warning', 'deactivate_urgent_warning'])
      .order('created_at', { ascending: false })
      .limit(8)
    setHistory(data ?? [])
  }

  useEffect(() => {
    loadHistory()
  }, [warning])

  async function trigger() {
    setBusy(true)
    await supabase.from('urgent_warnings').insert({
      message: message.trim() || DEFAULT_MESSAGE,
      is_active: true,
      triggered_by: user.id,
    })
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'trigger_urgent_warning',
      details: message.trim() || DEFAULT_MESSAGE,
    })
    setBusy(false)
    setConfirmOpen(false)
  }

  async function deactivate() {
    setBusy(true)
    await supabase
      .from('urgent_warnings')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('id', warning.id)
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'deactivate_urgent_warning',
      details: warning.id,
    })
    setBusy(false)
    setDeactivateOpen(false)
  }

  const previewMessage = (warning?.message || message || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start gap-4 border-b border-gray-200 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-urgent-100 text-urgent-600">
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Urgent Warning</h1>
          <p className="mt-1 text-sm text-gray-500">
            Instantly alert every logged-in student with a full-screen warning. Use this only for
            real emergencies (e.g. lockdown, active danger).
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            {warning ? (
              <div className="rounded-2xl border border-urgent-500 bg-urgent-50 p-4">
                <p className="mb-1 font-bold text-urgent-700">An Urgent Warning is currently ACTIVE</p>
                <p className="mb-4 text-sm text-gray-700">"{warning.message}"</p>
                <Button variant="urgent" onClick={() => setDeactivateOpen(true)}>
                  Deactivate warning for everyone
                </Button>
              </div>
            ) : (
              <>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Alert message shown to students
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
                />
                <Button variant="urgent" onClick={() => setConfirmOpen(true)} className="w-full">
                  <AlertTriangle size={18} strokeWidth={2} />
                  Trigger Urgent Warning
                </Button>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Preview — full-screen alert students see
            </h3>
            <div className="flex h-56 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-urgent-600 p-6 text-center text-white">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                <AlertTriangle size={26} strokeWidth={2} />
              </div>
              <p className="shrink-0 text-sm font-extrabold tracking-tight">Urgent Alert</p>
              <p className="line-clamp-3 max-w-xs text-xs leading-relaxed text-red-50">{previewMessage}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <History size={16} strokeWidth={2} className="text-brand-600" />
          Warning History
        </h2>
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No urgent warnings have been triggered yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {history.map((h) => {
              const isTrigger = h.action === 'trigger_urgent_warning'
              return (
                <div key={h.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isTrigger ? 'bg-urgent-100 text-urgent-600' : 'bg-calm-100 text-calm-600'
                    }`}
                  >
                    {isTrigger ? (
                      <AlertTriangle size={14} strokeWidth={2} />
                    ) : (
                      <ShieldCheck size={14} strokeWidth={2} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{h.actor?.full_name || 'Admin'}</span>{' '}
                      {isTrigger ? 'triggered an Urgent Warning' : 'deactivated the Urgent Warning'}
                    </p>
                    {isTrigger && h.details && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <UserRound size={11} strokeWidth={2} className="shrink-0" />
                        <span className="line-clamp-1">"{h.details}"</span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{formatDate(h.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Are you sure?"
        description="This will immediately alert all students with a full-screen warning that they cannot dismiss. Only trigger this for a real emergency."
        confirmLabel="Yes, alert all students"
        confirmVariant="urgent"
        onConfirm={trigger}
        onCancel={() => setConfirmOpen(false)}
        busy={busy}
      />

      <ConfirmModal
        open={deactivateOpen}
        title="Deactivate this warning?"
        description="The full-screen alert will disappear for every student immediately."
        confirmLabel="Deactivate"
        onConfirm={deactivate}
        onCancel={() => setDeactivateOpen(false)}
        busy={busy}
      />
    </div>
  )
}
