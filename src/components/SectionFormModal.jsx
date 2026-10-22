import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Button from './Button'

export default function SectionFormModal({ open, mode, sectionId, initialName = '', onClose, onSaved }) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError('')
    }
  }, [open, initialName])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Section name is required.')
      return
    }

    setBusy(true)
    setError('')
    const { error: dbError } =
      mode === 'create'
        ? await supabase.from('sections').insert({ name: trimmed })
        : await supabase.from('sections').update({ name: trimmed }).eq('id', sectionId)
    setBusy(false)

    if (dbError) {
      setError(dbError.code === '23505' ? 'A section with this name already exists.' : dbError.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {mode === 'create' ? 'Create section' : 'Rename section'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grade 10 - Section A"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
