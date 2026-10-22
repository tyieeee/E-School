import { useEffect, useId, useMemo, useState } from 'react'
import {
  User,
  Phone,
  MapPin,
  Search,
  RefreshCw,
  ShieldAlert,
  CircleAlert,
  LifeBuoy,
  Image,
  PhoneCall,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'

const STATUS_OPTIONS = ['new', 'reviewing', 'resolved', 'escalated']
const TYPE_LABELS = { bullying: 'Bullying', weapon: 'Weapon Sighting', other: 'Other' }
const TYPE_ICONS = { bullying: CircleAlert, weapon: ShieldAlert, other: LifeBuoy }
const TYPE_ICON_TONE = {
  bullying: 'bg-orange-100 text-orange-600',
  weapon: 'bg-urgent-100 text-urgent-600',
  other: 'bg-calm-100 text-calm-600',
}

function reportPhotoPaths(report) {
  if (report.photo_paths?.length) return report.photo_paths
  return report.photo_path ? [report.photo_path] : []
}
const STATUS_COLORS = {
  new: 'bg-brand-100 text-brand-700',
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

export default function Reports() {
  const [reports, setReports] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [photoUrls, setPhotoUrls] = useState({})
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const instanceId = useId()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
    setReports(data ?? [])

    const studentIds = [...new Set((data ?? []).map((r) => r.student_id))]
    if (studentIds.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', studentIds)
      const map = {}
      for (const p of profs ?? []) map[p.id] = p
      setProfiles(map)
    }

    // Load photo thumbnails immediately so admins don't have to click to see
    // evidence — signed URLs are short-lived, so fetch them fresh each load.
    const paths = (data ?? []).flatMap(reportPhotoPaths)
    if (paths.length) {
      const entries = await Promise.all(
        paths.map(async (path) => {
          const { data: signed } = await supabase.storage
            .from('report-evidence')
            .createSignedUrl(path, 60 * 10)
          return [path, signed?.signedUrl]
        })
      )
      setPhotoUrls(Object.fromEntries(entries.filter(([, url]) => url)))
    } else {
      setPhotoUrls({})
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`reports-admin-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [instanceId])

  async function updateStatus(id, status) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    await supabase.from('reports').update({ status }).eq('id', id)
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const stats = useMemo(
    () => ({
      new: reports.filter((r) => r.status === 'new').length,
      reviewing: reports.filter((r) => r.status === 'reviewing').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      escalated: reports.filter((r) => r.status === 'escalated').length,
    }),
    [reports]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      const student = profiles[r.student_id]
      const matchesQuery =
        !q ||
        r.description?.toLowerCase().includes(q) ||
        student?.full_name?.toLowerCase().includes(q) ||
        student?.student_number?.toLowerCase().includes(q)
      return (
        matchesQuery &&
        (statusFilter === 'all' || r.status === statusFilter) &&
        (typeFilter === 'all' || r.type === typeFilter)
      )
    })
  }, [reports, profiles, search, statusFilter, typeFilter])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Incident Reports" description="Review and triage student-submitted reports." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="New" value={stats.new} />
        <StatCard label="Reviewing" value={stats.reviewing} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Escalated" value={stats.escalated} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or description…"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {!loading && filtered.length === 0 && (
        <Card className="text-center text-sm text-gray-400">No reports match these filters.</Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((r) => {
          const student = profiles[r.student_id]
          const TypeIcon = TYPE_ICONS[r.type] ?? CircleAlert
          const photoPaths = reportPhotoPaths(r)
          const expanded = expandedIds.has(r.id)
          return (
            <Card key={r.id} className="p-4">
              <div
                onClick={() => toggleExpanded(r.id)}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TYPE_ICON_TONE[r.type] ?? 'bg-gray-100 text-gray-500'}`}
                  >
                    <TypeIcon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{TYPE_LABELS[r.type] ?? r.type}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                  </div>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${STATUS_COLORS[r.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 py-1.5 pl-1.5 pr-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
                        {student?.avatar_url ? (
                          <img src={student.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User size={13} strokeWidth={2} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {student?.full_name || 'Unknown student'}
                        </p>
                        <p className="text-[11px] text-gray-500">#{student?.student_number || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(r.id)
                    }}
                    aria-label={expanded ? 'Collapse report' : 'Expand report'}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {expanded && (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{r.description}</p>

                  {photoPaths.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {photoPaths.map((path) => (
                        <a
                          key={path}
                          href={photoUrls[path] || undefined}
                          target="_blank"
                          rel="noreferrer"
                          aria-disabled={!photoUrls[path]}
                          className={`group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${
                            photoUrls[path] ? '' : 'pointer-events-none'
                          }`}
                        >
                          {photoUrls[path] ? (
                            <>
                              <img
                                src={photoUrls[path]}
                                alt="Evidence"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                                <Image size={16} strokeWidth={2} className="text-white" />
                              </span>
                            </>
                          ) : (
                            <Image size={18} strokeWidth={2} className="text-gray-300" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} strokeWidth={2} className="shrink-0 text-gray-400" />
                        {student?.contact_number || 'No contact on file'}
                      </span>
                      {r.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} strokeWidth={2} className="shrink-0 text-gray-400" />
                          {r.location}
                        </span>
                      )}
                    </div>

                    <a
                      href="tel:911"
                      className="flex items-center gap-1.5 rounded-lg bg-urgent-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-urgent-700"
                    >
                      <PhoneCall size={13} strokeWidth={2.25} />
                      Call Police — 911
                    </a>
                  </div>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
