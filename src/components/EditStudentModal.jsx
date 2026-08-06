import { useEffect, useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Button from './Button'
import SectionSelect from './SectionSelect'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EditStudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    student_number: '',
    section_id: '',
    contact_number: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (student) {
      setForm({
        full_name: student.full_name || '',
        student_number: student.student_number || '',
        section_id: student.section_id || '',
        contact_number: student.contact_number || '',
        email: student.email || '',
      })
      setError('')
    }
  }, [student])

  if (!student) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.student_number.trim()) {
      setError('Full name and student number are required.')
      return
    }
    if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) {
      setError('Please enter a valid login email.')
      return
    }

    setBusy(true)
    const { data, error: invokeError } = await supabase.functions.invoke('manage-student', {
      body: { action: 'edit', student_id: student.id, ...form, email: form.email.trim() },
    })
    setBusy(false)

    if (invokeError || data?.error) {
      setError(data?.error || invokeError.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Pencil size={18} strokeWidth={2} className="text-brand-600" />
            Edit student
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
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Login email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="student@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Student number</label>
            <input
              value={form.student_number}
              onChange={(e) => setForm({ ...form, student_number: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Section <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <SectionSelect
              value={form.section_id}
              onChange={(id) => setForm((prev) => ({ ...prev, section_id: id }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Contact number</label>
            <input
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              placeholder="e.g. 09171234567"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-1 w-full">
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
