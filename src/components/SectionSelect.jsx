import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function SectionSelect({ value, onChange }) {
  const [sections, setSections] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadSections() {
    const { data } = await supabase.from('sections').select('id, name').order('name')
    setSections(data ?? [])
  }

  useEffect(() => {
    loadSections()
  }, [])

  function handleSelectChange(e) {
    const v = e.target.value
    if (v === '__new__') {
      setCreating(true)
      setNewName('')
      setError('')
    } else {
      onChange(v || null)
    }
  }

  async function confirmCreate() {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('sections')
      .insert({ name })
      .select('id, name')
      .single()
    setBusy(false)
    if (insertError) {
      setError(insertError.code === '23505' ? 'A section with this name already exists.' : insertError.message)
      return
    }
    await loadSections()
    onChange(data.id)
    setCreating(false)
  }

  if (creating) {
    return (
      <div>
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Grade 10 - Section A"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={confirmCreate}
            disabled={busy || !newName.trim()}
            aria-label="Save new section"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-50"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            aria-label="Cancel"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        {error && <p className="mt-1 text-xs font-medium text-urgent-600">{error}</p>}
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={handleSelectChange}
      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
    >
      <option value="">No section</option>
      {sections.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
      <option value="__new__">+ Create new section…</option>
    </select>
  )
}
