import { useState } from 'react'
import { X, FolderInput } from 'lucide-react'
import { supabase, getFunctionErrorMessage } from '../lib/supabaseClient'
import Button from './Button'
import SectionSelect from './SectionSelect'

export default function MoveStudentModal({ student, onClose, onMoved }) {
  const [sectionId, setSectionId] = useState(student?.section_id || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!student) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    const { data, error: invokeError } = await supabase.functions.invoke('manage-student', {
      body: {
        action: 'edit',
        student_id: student.id,
        full_name: student.full_name,
        student_number: student.student_number,
        contact_number: student.contact_number,
        section_id: sectionId,
      },
    })
    setBusy(false)

    if (invokeError || data?.error) {
      setError(await getFunctionErrorMessage(invokeError, data))
      return
    }

    onMoved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <FolderInput size={18} strokeWidth={2} className="text-brand-600" />
            Move student
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <p className="text-sm text-gray-600">
            Move <span className="font-semibold text-gray-900">{student.full_name}</span> to a
            different section.
          </p>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Section</label>
            <SectionSelect value={sectionId} onChange={setSectionId} />
          </div>

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-1 w-full">
            {busy ? 'Moving…' : 'Move student'}
          </Button>
        </form>
      </div>
    </div>
  )
}
