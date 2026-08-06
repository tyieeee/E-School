import { useEffect, useMemo, useState } from 'react'
import {
  UserRound,
  Search,
  RefreshCw,
  Plus,
  KeyRound,
  Trash2,
  Pencil,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Layers,
  FolderPlus,
  FolderInput,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import PageHeader from '../../components/PageHeader'
import AddStudentModal from '../../components/AddStudentModal'
import EditStudentModal from '../../components/EditStudentModal'
import SectionFormModal from '../../components/SectionFormModal'
import MoveStudentModal from '../../components/MoveStudentModal'
import StatCard from '../../components/StatCard'
import Toast from '../../components/Toast'

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-gray-700">
      <span>
        {label}: <span className="font-mono">{value}</span>
      </span>
      <button
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        {copied ? <Check size={14} strokeWidth={2} className="text-calm-600" /> : <Copy size={14} strokeWidth={2} />}
      </button>
    </div>
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sectionModal, setSectionModal] = useState(null) // { mode, sectionId, initialName }
  const [busy, setBusy] = useState(false)
  const [credentials, setCredentials] = useState(null) // { email, temp_password }
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingReset, setPendingReset] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)
  const [movingStudent, setMovingStudent] = useState(null)
  const [pendingDeleteSection, setPendingDeleteSection] = useState(null)
  const [selectedSectionId, setSelectedSectionId] = useState(null)

  async function loadStudents() {
    setLoading(true)
    const [{ data: studentRows }, { data: sectionRows }, { data: emailData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, section:sections(id, name)')
        .eq('role', 'student')
        .order('created_at', { ascending: false }),
      supabase.from('sections').select('id, name').order('name'),
      supabase.functions.invoke('manage-student', { body: { action: 'list_emails' } }),
    ])
    const emails = emailData?.emails ?? {}
    setStudents((studentRows ?? []).map((s) => ({ ...s, email: emails[s.id] ?? '' })))
    setSections(sectionRows ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((s) => !s.must_change_password).length,
      awaiting: students.filter((s) => s.must_change_password).length,
    }),
    [students]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q) ||
        s.contact_number?.toLowerCase().includes(q)
    )
  }, [students, search])

  const groupedStudents = useMemo(() => {
    const byId = new Map()
    for (const s of filtered) {
      const key = s.section_id || 'unassigned'
      if (!byId.has(key)) byId.set(key, [])
      byId.get(key).push(s)
    }

    const groups = sections
      .map((sec) => ({ id: sec.id, name: sec.name, students: byId.get(sec.id) || [] }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const unassigned = byId.get('unassigned') || []
    if (unassigned.length > 0) {
      groups.push({ id: 'unassigned', name: 'Unassigned', students: unassigned })
    }

    return groups
  }, [filtered, sections])

  const searching = search.trim().length > 0
  const selectedGroup = groupedStudents.find((g) => g.id === selectedSectionId) || null

  function handleCreated(creds) {
    setCredentials(creds)
    loadStudents()
  }

  async function confirmReset() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('manage-student', {
      body: { action: 'reset_password', student_id: pendingReset.id },
    })
    setBusy(false)
    setPendingReset(null)
    if (!error && !data?.error) {
      setCredentials({ email: pendingReset.email, temp_password: data.temp_password, isReset: true })
    }
  }

  async function confirmDelete() {
    setBusy(true)
    await supabase.functions.invoke('manage-student', {
      body: { action: 'delete', student_id: pendingDelete.id },
    })
    setBusy(false)
    setPendingDelete(null)
    loadStudents()
  }

  async function confirmDeleteSection() {
    setBusy(true)
    await supabase.from('sections').delete().eq('id', pendingDeleteSection.id)
    setBusy(false)
    if (selectedSectionId === pendingDeleteSection.id) setSelectedSectionId(null)
    setPendingDeleteSection(null)
    loadStudents()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        description="Create and manage student accounts."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setSectionModal({ mode: 'create', sectionId: null, initialName: '' })}
            >
              <FolderPlus size={16} strokeWidth={2.5} />
              Add section
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Add student
            </Button>
          </div>
        }
      />

      <SectionFormModal
        open={!!sectionModal}
        mode={sectionModal?.mode}
        sectionId={sectionModal?.sectionId}
        initialName={sectionModal?.initialName}
        onClose={() => setSectionModal(null)}
        onSaved={() => {
          setSectionModal(null)
          loadStudents()
        }}
      />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total students" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Awaiting first login" value={stats.awaiting} />
      </div>

      <AddStudentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />

      <EditStudentModal
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaved={() => {
          setEditingStudent(null)
          loadStudents()
        }}
      />

      <Toast open={!!credentials} onClose={() => setCredentials(null)}>
        <p className="mb-2 font-bold text-gray-900">
          {credentials?.isReset ? 'Password reset' : 'Account created'} — share with the student:
        </p>
        <div className="flex flex-col gap-1.5 rounded-xl bg-gray-50 p-3">
          <CopyField label="Email" value={credentials?.email || ''} />
          <CopyField label="Password" value={credentials?.temp_password || ''} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Shown only once. The student sets a new password on first login.
        </p>
      </Toast>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or student number…"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          onClick={loadStudents}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Sections */}
      {loading && <p className="py-8 text-center text-sm text-gray-400">Loading…</p>}

      {!loading && !selectedGroup && (
        <>
          {searching && filtered.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
              No students match your search.
            </div>
          )}
          {!searching && groupedStudents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
              No sections yet — click "Add section" to create one.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {groupedStudents.map(({ id, name, students: sectionStudents }) => (
              <div key={id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex w-full items-center justify-between gap-2 px-4 py-2 hover:bg-gray-50">
                  <button
                    onClick={() => setSelectedSectionId(id)}
                    className="flex flex-1 items-center gap-3 py-1.5 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <Layers size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500">
                        {sectionStudents.length} student{sectionStudents.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    {id !== 'unassigned' && (
                      <>
                        <button
                          onClick={() => setSectionModal({ mode: 'rename', sectionId: id, initialName: name })}
                          aria-label="Rename section"
                          title="Rename section"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil size={15} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setPendingDeleteSection({ id, name })}
                          aria-label="Delete section"
                          title="Delete section"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-urgent-50 hover:text-urgent-600"
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedSectionId(id)}
                      aria-label="View section"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                    >
                      <ChevronRight size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && selectedGroup && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <button
              onClick={() => setSelectedSectionId(null)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back to sections
            </button>
            {selectedGroup.id !== 'unassigned' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setSectionModal({ mode: 'rename', sectionId: selectedGroup.id, initialName: selectedGroup.name })
                  }
                  aria-label="Rename section"
                  title="Rename section"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setPendingDeleteSection({ id: selectedGroup.id, name: selectedGroup.name })}
                  aria-label="Delete section"
                  title="Delete section"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-urgent-50 hover:text-urgent-600"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Layers size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedGroup.name}</p>
              <p className="text-xs text-gray-500">
                {selectedGroup.students.length} student{selectedGroup.students.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Contact</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      No students in this section.
                    </td>
                  </tr>
                )}
                {selectedGroup.students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                          <UserRound size={16} strokeWidth={2} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{s.full_name}</p>
                          <p className="text-xs text-gray-500">#{s.student_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.contact_number || '—'}</td>
                    <td className="px-4 py-3">
                      {s.must_change_password ? (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          Awaiting first login
                        </span>
                      ) : (
                        <span className="rounded-full bg-calm-100 px-2.5 py-1 text-xs font-semibold text-calm-600">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setEditingStudent(s)}
                          aria-label="Edit student"
                          title="Edit student"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setMovingStudent(s)}
                          aria-label="Move to another section"
                          title="Move to another section"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                          <FolderInput size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setPendingReset(s)}
                          aria-label="Reset password"
                          title="Reset password"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 hover:bg-brand-50"
                        >
                          <KeyRound size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(s)}
                          aria-label="Delete student"
                          title="Delete student"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-urgent-600 hover:bg-urgent-50"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MoveStudentModal
        student={movingStudent}
        onClose={() => setMovingStudent(null)}
        onMoved={() => {
          setMovingStudent(null)
          loadStudents()
        }}
      />

      <ConfirmModal
        open={!!pendingReset}
        title="Reset this student's password?"
        description={`A new temporary password will be generated for ${pendingReset?.full_name}. They'll need to set a new one on next login.`}
        confirmLabel="Reset password"
        onConfirm={confirmReset}
        onCancel={() => setPendingReset(null)}
        busy={busy}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this student account?"
        description={`This permanently removes ${pendingDelete?.full_name}'s account and cannot be undone.`}
        confirmLabel="Delete account"
        confirmVariant="urgent"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={busy}
      />

      <ConfirmModal
        open={!!pendingDeleteSection}
        title="Delete this section?"
        description={`"${pendingDeleteSection?.name}" will be removed. Students in it are not deleted — they move to Unassigned.`}
        confirmLabel="Delete section"
        confirmVariant="urgent"
        onConfirm={confirmDeleteSection}
        onCancel={() => setPendingDeleteSection(null)}
        busy={busy}
      />
    </div>
  )
}
