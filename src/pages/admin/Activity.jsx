import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, History } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { ACTION_META, DEFAULT_ACTION_META, formatDate } from '../../lib/activity'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All activity' },
  { value: 'students', label: 'Students', actions: ['create_student', 'edit_student', 'reset_student_password', 'delete_student'] },
  { value: 'warnings', label: 'Urgent Warnings', actions: ['trigger_urgent_warning', 'deactivate_urgent_warning'] },
  { value: 'announcements', label: 'Announcements', actions: ['post_announcement', 'delete_announcement'] },
  { value: 'messages', label: 'Messages', actions: ['send_message'] },
]

const PAGE_SIZE = 50

export default function Activity() {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_log')
      .select('id, action, details, created_at, actor:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    setActivity(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const activeFilter = FILTER_OPTIONS.find((f) => f.value === filter)
    return activity.filter((a) => {
      const matchesFilter = filter === 'all' || activeFilter?.actions?.includes(a.action)
      const matchesQuery =
        !q ||
        a.actor?.full_name?.toLowerCase().includes(q) ||
        a.details?.toLowerCase().includes(q) ||
        a.action?.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [activity, search, filter])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Activity Log" description="A complete history of admin actions across the system." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin, action, or details…"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        >
          {FILTER_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      <Card className="p-4">
        {loading && <p className="py-8 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-400">
            <History size={24} strokeWidth={1.5} className="text-gray-300" />
            {activity.length === 0 ? 'No activity recorded yet.' : 'No activity matches your search.'}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-gray-100">
            {filtered.map((a) => {
              const meta = ACTION_META[a.action] ?? { ...DEFAULT_ACTION_META, label: a.action }
              const Icon = meta.icon
              return (
                <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{a.actor?.full_name || 'Admin'}</span>{' '}
                      {meta.label}
                    </p>
                    {a.details && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">"{a.details}"</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{formatDate(a.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {!loading && activity.length === PAGE_SIZE && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing the most recent {PAGE_SIZE} entries.
        </p>
      )}
    </div>
  )
}
