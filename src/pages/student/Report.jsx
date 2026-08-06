import { useState } from 'react'
import { Megaphone, ShieldAlert, CircleAlert, LifeBuoy, CheckCircle2, ImagePlus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import ConfirmModal from '../../components/ConfirmModal'
import SlideToConfirm from '../../components/SlideToConfirm'

const TYPES = [
  {
    value: 'bullying',
    label: 'Bullying',
    icon: CircleAlert,
    border: 'border-orange-500',
    tint: 'bg-orange-50',
    text: 'text-orange-700',
    badge: 'bg-orange-500',
  },
  {
    value: 'weapon',
    label: 'Weapon Sighting',
    icon: ShieldAlert,
    border: 'border-urgent-600',
    tint: 'bg-urgent-50',
    text: 'text-urgent-700',
    badge: 'bg-urgent-600',
  },
  {
    value: 'other',
    label: 'Other Safety Concern',
    icon: LifeBuoy,
    border: 'border-calm-600',
    tint: 'bg-calm-50',
    text: 'text-calm-600',
    badge: 'bg-calm-600',
  },
]

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_PHOTOS = 3

export default function Report() {
  const { user } = useAuth()
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [slideResetCount, setSlideResetCount] = useState(0)

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    setError('')
    if (!files.length) return

    const remainingSlots = MAX_PHOTOS - photos.length
    if (remainingSlots <= 0) {
      setError(`You can only attach up to ${MAX_PHOTOS} photos.`)
      return
    }

    const accepted = []
    for (const file of files.slice(0, remainingSlots)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Photos must be a JPG or PNG file.')
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setError('Photos must be smaller than 5MB.')
        continue
      }
      accepted.push(file)
    }
    if (files.length > remainingSlots) {
      setError(`You can only attach up to ${MAX_PHOTOS} photos.`)
    }
    setPhotos((prev) => [...prev, ...accepted])
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function validateAndConfirm() {
    setError('')
    if (!type) {
      setError('Please choose the type of concern.')
      setSlideResetCount((n) => n + 1)
      return
    }
    if (!description.trim()) {
      setError('Please describe what happened.')
      setSlideResetCount((n) => n + 1)
      return
    }
    setConfirmOpen(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    validateAndConfirm()
  }

  async function submitReport() {
    setBusy(true)
    setError('')

    const photo_paths = []

    try {
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('report-evidence')
          .upload(path, photo, { contentType: photo.type })
        if (uploadError) throw uploadError
        photo_paths.push(path)
      }

      const { error: insertError } = await supabase.from('reports').insert({
        student_id: user.id,
        type,
        description: description.trim(),
        location: location.trim() || null,
        photo_paths,
      })
      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-calm-50 text-calm-600">
            <CheckCircle2 size={30} strokeWidth={2} />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Report received</h1>
          <p className="text-sm text-gray-500">
            Thank you for speaking up. Only the Admin can see this report — your classmates never
            will. They'll review it as soon as possible.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setSubmitted(false)
              setType('')
              setDescription('')
              setLocation('')
              setPhotos([])
            }}
          >
            Submit another report
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <Megaphone size={22} strokeWidth={2} className="text-brand-800" />
        Report a Concern
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        This is private. Only your Admin will see this report — other students never will.
      </p>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-bold text-gray-800">What kind of concern is this?</p>
            <div className="grid grid-cols-3 gap-2.5">
              {TYPES.map((t) => {
                const selected = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-4 text-center text-[11px] font-semibold leading-tight transition-colors ${
                      selected
                        ? `${t.border} ${t.tint} ${t.text}`
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        selected ? `${t.badge} text-white` : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <t.icon size={18} strokeWidth={2} />
                    </span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="report-description" className="mb-2 block text-sm font-bold text-gray-800">
              What happened? (required)
            </label>
            <textarea
              id="report-description"
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us as much as you can…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label htmlFor="report-location" className="mb-2 block text-sm font-bold text-gray-800">
              Location / room (optional)
            </label>
            <input
              id="report-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gym, Room 204"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Add photos (optional)</p>
              <span className="text-xs font-medium text-gray-400">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            {photos.length > 0 && (
              <ul className="mb-2 flex flex-col gap-2">
                {photos.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 shadow-sm">
                      <ImagePlus size={14} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="shrink-0 text-xs font-semibold text-urgent-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor="report-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-800 shadow-sm">
                  <ImagePlus size={18} strokeWidth={2} />
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {photos.length ? 'Add another photo' : 'Tap to upload photos'}
                </span>
                <span className="text-xs text-gray-400">
                  JPG or PNG, up to 5MB each — up to {MAX_PHOTOS} photos
                </span>
                <input
                  id="report-photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && <p className="text-sm font-medium text-urgent-600">{error}</p>}

          <div className="mt-1">
            <SlideToConfirm
              label="Slide to submit"
              onComplete={validateAndConfirm}
              disabled={busy}
              resetSignal={`${confirmOpen}-${slideResetCount}`}
            />
          </div>
        </form>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Send this report to your Admin?"
        description="Your Admin will see your name with this report, but other students never will."
        confirmLabel="Yes, submit report"
        onConfirm={submitReport}
        onCancel={() => setConfirmOpen(false)}
        busy={busy}
      />
    </div>
  )
}
