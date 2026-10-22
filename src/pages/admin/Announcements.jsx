import { useEffect, useState } from 'react'
import { Pin, Bell, Megaphone, Send, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmModal from '../../components/ConfirmModal'
import PageHeader from '../../components/PageHeader'

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [pinned, setPinned] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim() || !message.trim()) {
      setError('Please fill in both the title and message.')
      return
    }
    setBusy(true)
    const trimmedTitle = title.trim()
    const { error: insertError } = await supabase.from('announcements').insert({
      title: trimmedTitle,
      message: message.trim(),
      pinned,
      created_by: user.id,
    })
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'post_announcement',
      details: trimmedTitle,
    })
    setTitle('')
    setMessage('')
    setPinned(false)
    load()
  }

  async function confirmDelete() {
    setBusy(true)
    await supabase.from('announcements').delete().eq('id', pendingDelete.id)
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'delete_announcement',
      details: pendingDelete.title,
    })
    setBusy(false)
    setPendingDelete(null)
    load()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Announcements" description="Broadcast updates to every student." />

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Megaphone size={18} strokeWidth={2} />
              </div>
              <h2 className="font-bold text-gray-900">New announcement</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
              />
              <textarea
                placeholder="Message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPinned((v) => !v)}
                className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  pinned
                    ? 'border-brand-200 bg-brand-100 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Pin size={13} strokeWidth={2.5} />
                {pinned ? 'Pinned to top' : 'Pin to top'}
              </button>
              {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}
              <Button type="submit" disabled={busy} className="mt-1 w-full">
                <Send size={16} strokeWidth={2} />
                {busy ? 'Posting…' : 'Post announcement'}
              </Button>
            </form>
          </div>

          <div className="border-t border-gray-100 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Preview — how students will see it
            </h3>
            {!title.trim() && !message.trim() ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 text-center text-sm text-gray-400">
                <Bell size={22} strokeWidth={1.5} className="text-gray-300" />
                Start typing to preview
              </div>
            ) : (
              <div className={`rounded-2xl border bg-white p-4 ${pinned ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-200'}`}>
                <div className="mb-1 flex items-center gap-2">
                  {pinned && (
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-600">
                      <Pin size={12} strokeWidth={2.5} />
                      PINNED
                    </span>
                  )}
                  <h4 className="font-bold text-gray-900">{title.trim() || 'Untitled announcement'}</h4>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {message.trim() || 'Your message will appear here…'}
                </p>
                <p className="mt-2 text-xs text-gray-400">Just now</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
        Recent announcements
      </h2>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
          <Bell size={24} strokeWidth={1.5} className="text-gray-300" />
          No announcements yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <div className="mb-1 flex items-start justify-between gap-2">
              <div>
                {a.pinned && (
                  <span className="mr-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
                    <Pin size={12} strokeWidth={2.5} />
                    PINNED
                  </span>
                )}
                <span className="font-bold text-gray-900">{a.title}</span>
              </div>
              <button
                onClick={() => setPendingDelete(a)}
                aria-label="Delete announcement"
                title="Delete announcement"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-urgent-600 hover:bg-urgent-50"
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{a.message}</p>
            <p className="mt-2 text-xs text-gray-400">{formatDate(a.created_at)}</p>
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this announcement?"
        description="Students will no longer see it in their feed."
        confirmLabel="Delete"
        confirmVariant="urgent"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={busy}
      />
    </div>
  )
}
