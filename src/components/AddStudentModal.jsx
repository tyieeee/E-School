import { useEffect, useRef, useState } from 'react'
import { ScanLine, Upload, X, CheckCircle2, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { scanIdImage, generateEmailFromName } from '../lib/idScan'
import Button from './Button'
import SectionSelect from './SectionSelect'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function AddStudentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', student_number: '', section_id: '', email: '', password: '' })
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState(null) // 'found' | 'partial' | 'none'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, password: generateTempPassword() }))
    }
  }, [open])

  if (!open) return null

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'full_name' && !emailTouched) {
        next.email = generateEmailFromName(value)
      }
      return next
    })
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    setError('')
    setScanResult(null)
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('ID photo must be a JPG or PNG file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('ID photo must be smaller than 5MB.')
      return
    }

    setPhotoPreview(URL.createObjectURL(file))
    setScanning(true)
    setScanProgress(0)

    try {
      const { name, studentNumber } = await scanIdImage(file, setScanProgress)

      setForm((prev) => {
        const next = { ...prev }
        if (name) next.full_name = name
        if (studentNumber) next.student_number = studentNumber
        if (name && !emailTouched) next.email = generateEmailFromName(name)
        return next
      })

      if (name && studentNumber) setScanResult('found')
      else if (name || studentNumber) setScanResult('partial')
      else setScanResult('none')
    } catch {
      setScanResult('none')
      setError('Could not scan this image. You can still fill in the details manually.')
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.student_number.trim() || !form.email.trim()) {
      setError('Please fill in every field.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setBusy(true)
    const { data, error: invokeError } = await supabase.functions.invoke('manage-student', {
      body: { action: 'create', ...form },
    })
    setBusy(false)

    if (invokeError || data?.error) {
      setError(data?.error || invokeError.message)
      return
    }

    onCreated({ email: form.email, temp_password: data.temp_password })
    handleClose()
  }

  function handleClose() {
    setForm({ full_name: '', student_number: '', section_id: '', email: '', password: '' })
    setEmailTouched(false)
    setPasswordVisible(false)
    setPhotoPreview(null)
    setScanResult(null)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Add a new student</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Scan student ID <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-60"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="ID preview" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <ScanLine size={20} strokeWidth={2} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {scanning ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                    Scanning… {scanProgress}%
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700">
                      {photoPreview ? 'Replace photo' : 'Upload a photo of the ID'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {photoPreview ? 'Tap to scan a different ID' : 'JPG or PNG — we’ll try to read the name and student number'}
                    </p>
                  </>
                )}
              </div>
              {!scanning && !photoPreview && <Upload size={16} strokeWidth={2} className="shrink-0 text-gray-300" />}
            </button>

            {scanResult === 'found' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-calm-600">
                <CheckCircle2 size={13} strokeWidth={2} />
                Detected a name and student number — please review below before saving.
              </p>
            )}
            {scanResult === 'partial' && (
              <p className="mt-2 text-xs font-medium text-yellow-700">
                Only partially readable — please check and complete the fields below.
              </p>
            )}
            {scanResult === 'none' && !error && (
              <p className="mt-2 text-xs text-gray-500">
                Couldn't confidently read this ID — please fill in the details manually.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Student number</label>
            <input
              value={form.student_number}
              onChange={(e) => updateField('student_number', e.target.value)}
              placeholder="2026-00123"
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
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Email <span className="font-normal text-gray-400">(auto-generated from name — editable)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setEmailTouched(true)
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }}
              placeholder="juan@eschool.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Temporary password <span className="font-normal text-gray-400">(pre-filled — editable)</span>
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                minLength={8}
                className="w-full rounded-xl border border-gray-300 py-3 pl-4 pr-20 text-sm focus:border-brand-500 focus:outline-none"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, password: generateTempPassword() }))}
                  aria-label="Generate new password"
                  title="Generate new password"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <RefreshCw size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  {passwordVisible ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">At least 8 characters. The student will set their own on first login.</p>
          </div>

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <Button type="submit" disabled={busy || scanning} className="mt-1 w-full">
            {busy ? 'Creating…' : 'Create student account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
