import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  UserPlus,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  PieChart,
  Activity,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { ACTION_META, DEFAULT_ACTION_META, formatRelative } from '../../lib/activity'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import MonthlyReportsChart from '../../components/MonthlyReportsChart'
import TypeDonutChart from '../../components/TypeDonutChart'
import StatCard from '../../components/StatCard'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_BACK = 6

const TYPE_LABELS = { bullying: 'Bullying', weapon: 'Weapon Sighting', other: 'Other' }
// Validated with the dataviz palette checker: amber/red/teal clear the CVD and
// normal-vision separation floors as a trio — plain orange sat too close to
// red to tell apart even with full-color vision.
const TYPE_HEX = {
  bullying: '#f59e0b',
  weapon: '#ef4444',
  other: '#14b8a6',
}

function buildMonthlySeries(reportDates) {
  const now = new Date()
  const buckets = []
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()], value: 0 })
  }
  for (const iso of reportDates) {
    const d = new Date(iso)
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth())
    if (bucket) bucket.value += 1
  }
  return buckets
}

function QuickAction({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-brand-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ newReports: 0, totalStudents: 0, totalSections: 0 })
  const [monthlySeries, setMonthlySeries] = useState(() => buildMonthlySeries([]))
  const [typeBreakdown, setTypeBreakdown] = useState([])
  const [activity, setActivity] = useState([])

  useEffect(() => {
    async function load() {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - (MONTHS_BACK - 1))
      sixMonthsAgo.setDate(1)

      const [
        { count: newReports },
        { count: totalStudents },
        { count: totalSections },
        { data: allDates },
        { data: allTypes },
        { data: auditRows },
      ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('sections').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
        supabase.from('reports').select('type'),
        supabase
          .from('audit_log')
          .select('id, action, details, created_at, actor:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      setStats({
        newReports: newReports ?? 0,
        totalStudents: totalStudents ?? 0,
        totalSections: totalSections ?? 0,
      })
      setMonthlySeries(buildMonthlySeries((allDates ?? []).map((r) => r.created_at)))

      const counts = { bullying: 0, weapon: 0, other: 0 }
      for (const r of allTypes ?? []) {
        if (counts[r.type] !== undefined) counts[r.type] += 1
      }
      const total = counts.bullying + counts.weapon + counts.other
      setTypeBreakdown(
        Object.entries(counts).map(([type, count]) => ({
          type,
          count,
          pct: total ? Math.round((count / total) * 100) : 0,
        }))
      )

      setActivity(auditRows ?? [])
    }
    load()
  }, [])

  const totalRecent = monthlySeries.reduce((sum, m) => sum + m.value, 0)
  const totalReportsAllTime = typeBreakdown.reduce((sum, t) => sum + t.count, 0)

  // Real trend, not an invented figure: the most recent half of the 6-month
  // window vs the half before it. Deliberately rendered without red/green
  // "good vs bad" framing below — more incident reports isn't unambiguously
  // bad news (could mean students feel safer reporting), so only direction
  // and magnitude are shown, not a value judgment.
  const trendHalf = Math.floor(monthlySeries.length / 2)
  const trendOlderSum = monthlySeries.slice(0, trendHalf).reduce((sum, m) => sum + m.value, 0)
  const trendRecentSum = monthlySeries.slice(trendHalf).reduce((sum, m) => sum + m.value, 0)
  const trendDeltaPct = trendOlderSum > 0 ? Math.round(((trendRecentSum - trendOlderSum) / trendOlderSum) * 100) : null

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Dashboard" description="An overview of school safety activity." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Sections"
          value={stats.totalSections}
          to="/admin/students"
          linkLabel="Manage sections"
        />
        <StatCard
          label="New Reports"
          value={stats.newReports}
          to="/admin/reports"
          linkLabel="Review reports"
        />
        <StatCard
          label="Students"
          value={stats.totalStudents}
          to="/admin/students"
          linkLabel="Manage students"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
            <TrendingUp size={16} strokeWidth={2} className="text-brand-600" />
            Reports Overview
          </div>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-extrabold leading-none text-gray-900">{totalRecent}</span>
            <span className="text-xs text-gray-500">reports in the last {MONTHS_BACK} months</span>
            {trendDeltaPct !== null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                {trendDeltaPct >= 0 ? (
                  <ArrowUp size={11} strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={11} strokeWidth={2.5} />
                )}
                {Math.abs(trendDeltaPct)}% vs previous 3 months
              </span>
            )}
          </div>

          <MonthlyReportsChart data={monthlySeries} height={180} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <PieChart size={16} strokeWidth={2} className="text-brand-600" />
            By Type
          </h2>
          {totalReportsAllTime === 0 ? (
            <p className="py-2 text-sm text-gray-400">No reports yet.</p>
          ) : (
            <TypeDonutChart
              breakdown={typeBreakdown}
              labels={TYPE_LABELS}
              colors={TYPE_HEX}
              total={totalReportsAllTime}
            />
          )}
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Quick Actions</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <QuickAction icon={<UserPlus size={17} strokeWidth={2} />} label="Add Student" to="/admin/students" />
          <QuickAction icon={<Megaphone size={17} strokeWidth={2} />} label="Post Announcement" to="/admin/announcements" />
          <QuickAction icon={<MessageSquare size={17} strokeWidth={2} />} label="Message a Student" to="/admin/messages" />
          <QuickAction icon={<ShieldAlert size={17} strokeWidth={2} />} label="Urgent Warning" to="/admin/urgent-warning" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Activity size={16} strokeWidth={2} className="text-brand-600" />
            Recent Activity
          </h2>
          <Link
            to="/admin/activity"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {activity.map((a) => {
              const meta = ACTION_META[a.action] ?? { ...DEFAULT_ACTION_META, label: a.action }
              const Icon = meta.icon
              return (
                <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{a.actor?.full_name || 'Admin'}</span>{' '}
                    {meta.label}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400">{formatRelative(a.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
