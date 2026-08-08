import { useEffect, useMemo, useRef, useState } from 'react'
import { Phone, Send, Search, MessageSquare, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { groupMessages } from '../../lib/chatGroups'
import Button from '../../components/Button'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import Switch from '../../components/Switch'

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

export default function Messages() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [thread, setThread] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [accessBusy, setAccessBusy] = useState(false)
  const bottomRef = useRef(null)

  async function loadStudents() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
    setStudents(data ?? [])
  }

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setThread([])
      return
    }
    let active = true

    async function load() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('student_id', selectedId)
        .order('created_at', { ascending: true })
      if (active) setThread(data ?? [])
    }

    load()

    const channel = supabase
      .channel(`dm-admin-${selectedId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages', filter: `student_id=eq.${selectedId}` },
        load
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [selectedId])

  useEffect(() => {
    if (selectedId) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [selectedId, thread])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || !selectedId) return
    setBusy(true)
    await supabase.from('direct_messages').insert({
      student_id: selectedId,
      sender_id: user.id,
      message: text.trim(),
    })
    const recipient = students.find((s) => s.id === selectedId)
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'send_message',
      details: recipient ? `Messaged ${recipient.full_name}` : 'Sent a direct message',
    })
    setText('')
    setBusy(false)
  }

  async function setReplyAccess(allowed) {
    if (!selectedId) return
    setAccessBusy(true)
    await supabase.rpc('set_reply_access', { target_student_id: selectedId, allowed })
    await loadStudents()
    setAccessBusy(false)
  }

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) => s.full_name?.toLowerCase().includes(q) || s.student_number?.toLowerCase().includes(q)
    )
  }, [students, search])

  const selectedStudent = students.find((s) => s.id === selectedId)
  const requestPending = Boolean(selectedStudent?.reply_requested_at) && !selectedStudent?.can_reply_to_admin

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Direct Messages" description="Message a specific student directly." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="flex h-[28rem] flex-col p-0 lg:col-span-1 lg:h-[32rem]">
          <div className="border-b border-gray-100 p-4">
            <div className="relative">
              <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">No students found.</p>
            )}
            {filteredStudents.map((s) => {
              const pending = Boolean(s.reply_requested_at) && !s.can_reply_to_admin
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 ${
                    selectedId === s.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(s.full_name)
                    )}
                    {pending && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-urgent-600 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{s.full_name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {pending ? 'Requested reply access' : s.contact_number || 'No contact number'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex h-[28rem] flex-col p-0 lg:col-span-2 lg:h-[32rem]">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center text-sm text-gray-400">
              <MessageSquare size={28} strokeWidth={1.5} className="text-gray-300" />
              Select a student to start messaging.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {selectedStudent?.avatar_url ? (
                      <img src={selectedStudent.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(selectedStudent?.full_name)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedStudent?.full_name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone size={13} strokeWidth={2} />
                      {selectedStudent?.contact_number || 'No contact number'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-full bg-gray-50 py-1.5 pl-3 pr-1.5">
                  <span
                    className={`text-xs font-bold ${
                      selectedStudent?.can_reply_to_admin ? 'text-calm-600' : 'text-gray-400'
                    }`}
                  >
                    {selectedStudent?.can_reply_to_admin ? 'Replies on' : 'Replies off'}
                  </span>
                  <Switch
                    checked={Boolean(selectedStudent?.can_reply_to_admin)}
                    onChange={(val) => setReplyAccess(val)}
                    disabled={accessBusy}
                  />
                </div>
              </div>

              {requestPending && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-orange-50 px-4 py-3">
                  <p className="text-sm font-semibold text-orange-700">
                    {selectedStudent.full_name} is asking for permission to reply.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReplyAccess(true)}
                      disabled={accessBusy}
                      className="flex items-center gap-1 rounded-lg bg-calm-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-calm-700 disabled:opacity-50"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      Approve
                    </button>
                    <button
                      onClick={() => setReplyAccess(false)}
                      disabled={accessBusy}
                      className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X size={13} strokeWidth={2.5} />
                      Deny
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-4">
                {thread.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">No messages yet with this student.</p>
                )}
                {groupMessages(thread).map((group, gi) => {
                  const fromStudent = group.senderId === selectedId
                  const lastInGroup = group.messages[group.messages.length - 1]
                  return (
                    <div key={gi} className={`flex min-w-0 items-end gap-2 ${fromStudent ? 'flex-row' : 'flex-row-reverse'}`}>
                      {fromStudent && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                          {selectedStudent?.avatar_url ? (
                            <img src={selectedStudent.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(selectedStudent?.full_name)
                          )}
                        </div>
                      )}
                      <div className={`flex min-w-0 max-w-[75%] flex-col gap-1 ${fromStudent ? 'items-start' : 'items-end'}`}>
                        <span className="px-1 text-xs font-semibold text-gray-500">
                          {fromStudent ? selectedStudent?.full_name : 'You'}
                        </span>
                        {group.messages.map((m, mi) => (
                          <div
                            key={m.id}
                            className={`min-w-0 max-w-full break-words rounded-2xl px-4 py-2.5 text-sm ${
                              fromStudent
                                ? `bg-gray-100 text-gray-800 ${mi === 0 ? 'rounded-tl-sm' : ''}`
                                : `bg-brand-600 text-white ${mi === 0 ? 'rounded-tr-sm' : ''}`
                            }`}
                          >
                            {m.message}
                          </div>
                        ))}
                        <span className="px-1 text-[10px] text-gray-400">{formatDate(lastInGroup.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-100 p-4">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
                />
                <Button type="submit" disabled={busy || !text.trim()}>
                  <Send size={16} strokeWidth={2} />
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
