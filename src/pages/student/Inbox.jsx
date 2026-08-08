import { useEffect, useId, useRef, useState } from 'react'
import { Inbox as InboxIcon, ShieldCheck, ArrowLeft, Send, Lock, MessageCircleQuestion } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { groupMessages } from '../../lib/chatGroups'

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Inbox() {
  const { user, profile, refreshProfile } = useAuth()
  const [messages, setMessages] = useState([])
  const [admins, setAdmins] = useState({})
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const instanceId = useId()
  const bottomRef = useRef(null)
  const replyInputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    let active = true

    async function load() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: true })
      if (!active) return
      setMessages(data ?? [])
      setLoading(false)
    }

    load()
    refreshProfile()

    supabase
      .from('admin_directory')
      .select('*')
      .then(({ data }) => {
        if (!active || !data) return
        setAdmins(Object.fromEntries(data.map((a) => [a.id, a])))
      })

    const channel = supabase
      .channel(`inbox-student-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages', filter: `student_id=eq.${user.id}` },
        load
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user, instanceId, refreshProfile])

  async function openThread() {
    setOpened(true)
    const unreadIds = messages.filter((m) => !m.read).map((m) => m.id)
    if (unreadIds.length) {
      setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)))
      await supabase.from('direct_messages').update({ read: true }).in('id', unreadIds)
    }
  }

  useEffect(() => {
    if (opened) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [opened, messages])

  // Some mobile browsers don't shrink the layout viewport for the on-screen
  // keyboard, so the reply box can end up hidden behind it — nudge it back
  // into view once the keyboard finishes animating in.
  function handleReplyFocus() {
    setTimeout(() => replyInputRef.current?.scrollIntoView({ block: 'center' }), 300)
  }

  async function requestReplyAccess() {
    if (!user) return
    setRequesting(true)
    await supabase
      .from('profiles')
      .update({ reply_requested_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    setRequesting(false)
  }

  async function sendReply(e) {
    e.preventDefault()
    if (!reply.trim() || !user) return
    setSending(true)
    await supabase.from('direct_messages').insert({
      student_id: user.id,
      sender_id: user.id,
      message: reply.trim(),
    })
    setReply('')
    setSending(false)
  }

  const unreadCount = messages.filter((m) => !m.read && m.sender_id !== user.id).length
  const latest = messages[messages.length - 1]
  const lastAdminMessage = [...messages].reverse().find((m) => m.sender_id !== user.id)
  const latestAdmin = lastAdminMessage ? admins[lastAdminMessage.sender_id] : null
  const canReply = Boolean(profile?.can_reply_to_admin)
  const requestPending = Boolean(profile?.reply_requested_at) && !canReply

  if (opened) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <button
          onClick={() => setOpened(false)}
          className="mb-4 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-sm font-bold text-brand-800">
              {latestAdmin?.avatar_url ? (
                <img src={latestAdmin.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : latestAdmin?.full_name ? (
                initials(latestAdmin.full_name)
              ) : (
                <ShieldCheck size={20} strokeWidth={2} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-gray-900">{latestAdmin?.full_name || 'E-School Admin'}</p>
              <p className="text-xs text-gray-400">Your school admin</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            {groupMessages(messages).map((group, gi) => {
              const mine = group.senderId === user.id
              const sender = admins[group.senderId]
              const lastInGroup = group.messages[group.messages.length - 1]
              return (
                <div key={gi} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!mine && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-[10px] font-bold text-brand-800">
                      {sender?.avatar_url ? (
                        <img src={sender.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : sender?.full_name ? (
                        initials(sender.full_name)
                      ) : (
                        <ShieldCheck size={14} strokeWidth={2} />
                      )}
                    </span>
                  )}
                  <div className={`flex max-w-[75%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
                    {!mine && (
                      <span className="px-1 text-xs font-semibold text-gray-500">
                        {sender?.full_name || 'E-School Admin'}
                      </span>
                    )}
                    {group.messages.map((m, mi) => (
                      <div
                        key={m.id}
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          mine ? 'bg-brand-600 text-white' : 'border border-gray-100 bg-gray-50 text-gray-700'
                        } ${mi === 0 ? (mine ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}`}
                      >
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))}
                    <span className="px-1 text-[11px] text-gray-400">{formatDate(lastInGroup.created_at)}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-gray-100 p-4">
            {canReply ? (
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  ref={replyInputRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onFocus={handleReplyFocus}
                  placeholder="Type a reply…"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} strokeWidth={2} />
                </button>
              </form>
            ) : requestPending ? (
              <div className="flex flex-col items-center gap-1 py-1 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-800">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <p className="mt-1.5 text-sm font-semibold text-gray-700">Request sent</p>
                <p className="text-xs text-gray-400">Waiting for your Admin to allow replies.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <p className="mt-1 text-sm text-gray-500">Want to reply? Ask your Admin for permission first.</p>
                <button
                  onClick={requestReplyAccess}
                  disabled={requesting}
                  className="mt-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {requesting ? 'Sending…' : 'Request to reply'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <InboxIcon size={22} strokeWidth={2} className="text-brand-800" />
        Inbox
      </h1>
      <p className="mb-6 text-sm text-gray-500">Messages sent to you by your Admin.</p>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {!loading && messages.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400 shadow-sm">
          No messages yet.
        </div>
      )}

      {!loading && messages.length > 0 && (
        <button
          onClick={openThread}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-sm font-bold text-brand-800">
            {latestAdmin?.avatar_url ? (
              <img src={latestAdmin.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : latestAdmin?.full_name ? (
              initials(latestAdmin.full_name)
            ) : (
              <ShieldCheck size={20} strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-bold text-gray-900">E-School Admin</p>
              <span className="shrink-0 text-xs text-gray-400">{formatTime(latest.created_at)}</span>
            </div>
            <p className={`truncate text-sm ${unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {latest.sender_id === user.id && <span className="text-gray-400">You: </span>}
              {latest.message}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {!loading && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 ring-1 ring-brand-100">
            <MessageCircleQuestion size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">How messaging works</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-900/70">
              Only your Admin can start a conversation here. Want to reply? Open the message and tap{' '}
              <span className="font-semibold text-brand-800">Request to reply</span> — your Admin has to
              approve it first before you can send anything back.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
