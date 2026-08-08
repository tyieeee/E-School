import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { User, LogOut, Camera, KeyRound, ChevronLeft, ChevronRight, BadgeCheck, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { hashPasscode } from '../../lib/passcode'
import Button from '../../components/Button'
import CenterToast from '../../components/CenterToast'
import PinInput from '../../components/PinInput'
import GoogleIcon from '../../components/GoogleIcon'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_BYTES = 3 * 1024 * 1024
const MIN_PASSCODE_LENGTH = 4 // matches the 4–6 digit passcode rule enforced on submit

function initials(name) {
  if (!name) return 'S'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Settings() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [view, setView] = useState('list')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [currentPasscode, setCurrentPasscode] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const currentFilled = currentPasscode.length >= MIN_PASSCODE_LENGTH
  const newFilled = newPasscode.length >= MIN_PASSCODE_LENGTH
  const confirmFilled = confirmPasscode.length >= MIN_PASSCODE_LENGTH
  const [passcodeError, setPasscodeError] = useState('')
  const [passcodeBusy, setPasscodeBusy] = useState(false)
  const [requestingPasscodeReset, setRequestingPasscodeReset] = useState(false)

  const [toast, setToast] = useState(null)

  const [showPasswordPanel, setShowPasswordPanel] = useState(false)
  const [passwordUnlocked, setPasswordUnlocked] = useState(false)
  const [passwordGateCode, setPasswordGateCode] = useState('')
  const [passwordGateError, setPasswordGateError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const hasPasscode = Boolean(profile?.reports_passcode_hash)
  const passcodeResetRequested = Boolean(profile?.passcode_reset_requested_at)

  function openPasscode() {
    setCurrentPasscode('')
    setNewPasscode('')
    setConfirmPasscode('')
    setPasscodeError('')
    setView('passcode')
  }

  function openPasswordToggle() {
    setPasswordGateCode('')
    setPasswordGateError('')
    setNewPassword('')
    setConfirmNewPassword('')
    setPasswordChangeError('')
    setPasswordUnlocked(!hasPasscode)
    setShowPasswordPanel(true)
  }

  async function handlePasswordGateSubmit(e) {
    e.preventDefault()
    setPasswordGateError('')
    const hash = await hashPasscode(passwordGateCode)
    if (hash !== profile.reports_passcode_hash) {
      setPasswordGateError('Incorrect passcode.')
      return
    }
    setPasswordUnlocked(true)
  }

  async function handlePasswordChangeSubmit(e) {
    e.preventDefault()
    setPasswordChangeError('')

    if (newPassword.length < 8) {
      setPasswordChangeError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Passwords do not match.')
      return
    }

    setChangingPassword(true)
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)

    if (passwordError) {
      setPasswordChangeError(passwordError.message)
      return
    }

    setShowPasswordPanel(false)
    setToast({ type: 'success', message: 'Password changed.' })
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    setAvatarError('')
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Photo must be a JPG, PNG, or WEBP file.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Photo must be smaller than 3MB.')
      return
    }

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      setUploadingAvatar(false)
      setAvatarError(uploadError.message)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
      .eq('id', user.id)

    setUploadingAvatar(false)

    if (updateError) {
      setAvatarError(updateError.message)
      return
    }

    await refreshProfile()
  }

  async function handlePasscodeSubmit(e) {
    e.preventDefault()
    setPasscodeError('')

    if (!/^\d{4,6}$/.test(newPasscode)) {
      setPasscodeError('New passcode must be 4–6 digits.')
      return
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeError('New passcodes do not match.')
      return
    }

    setPasscodeBusy(true)

    if (hasPasscode) {
      if (!currentPasscode) {
        setPasscodeBusy(false)
        setPasscodeError('Please enter your current passcode.')
        return
      }
      const currentHash = await hashPasscode(currentPasscode)
      if (currentHash !== profile.reports_passcode_hash) {
        setPasscodeBusy(false)
        setPasscodeError('Current passcode is incorrect.')
        return
      }
    }

    const newHash = await hashPasscode(newPasscode)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ reports_passcode_hash: newHash })
      .eq('id', user.id)

    setPasscodeBusy(false)

    if (updateError) {
      setPasscodeError(updateError.message)
      return
    }

    await refreshProfile()
    setCurrentPasscode('')
    setNewPasscode('')
    setConfirmPasscode('')
    setView('list')
    setToast({ type: 'success', message: hasPasscode ? 'Passcode updated.' : 'Passcode set.' })
  }

  async function requestPasscodeReset() {
    if (!user) return
    setRequestingPasscodeReset(true)
    await supabase
      .from('profiles')
      .update({ passcode_reset_requested_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    setRequestingPasscodeReset(false)
  }

  if (view === 'personal') {
    return (
      <div className="mx-auto max-w-md">
        <CenterToast toast={toast} onDismiss={() => setToast(null)} />
        <button
          onClick={() => setView('list')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          Profile
        </button>
        <h1 className="mb-1 text-xl font-bold text-gray-900">Personal Information</h1>
        <p className="mb-6 text-sm text-gray-500">Set by your Admin — contact them to make changes.</p>

        <div className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <User size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Full name</p>
              <p className="truncate text-sm font-semibold text-gray-800">{profile?.full_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Login email</p>
              <p className="truncate text-sm font-semibold text-gray-800">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Phone size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">Contact number</p>
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {profile?.contact_number || '—'}
                </p>
                {profile?.contact_number_verified && (
                  <BadgeCheck size={14} strokeWidth={2} className="shrink-0 text-calm-600" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <GoogleIcon size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Gmail</p>
              <p className="truncate text-sm font-semibold text-gray-800">
                {profile?.contact_email || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Lock size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">Password</p>
              <p className="truncate text-sm font-semibold tracking-widest text-gray-800">••••••••</p>
            </div>
            <button
              type="button"
              onClick={() => (showPasswordPanel ? setShowPasswordPanel(false) : openPasswordToggle())}
              aria-label={showPasswordPanel ? 'Close password panel' : 'Change password'}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              {showPasswordPanel ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {showPasswordPanel &&
          !passwordUnlocked &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <form onSubmit={handlePasswordGateSubmit} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                      <Lock size={16} strokeWidth={2} />
                    </span>
                    <p className="text-sm font-bold text-gray-800">Enter your My Reports passcode</p>
                  </div>
                  <PinInput value={passwordGateCode} onChange={setPasswordGateCode} autoFocus />
                  {passwordGateError && (
                    <p className="text-center text-sm font-medium text-urgent-600">{passwordGateError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordPanel(false)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

        {showPasswordPanel && passwordUnlocked && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-4">
                <p className="text-sm font-bold text-gray-800">Change password</p>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  New password
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Confirm new password
                  <input
                    type="password"
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                {passwordChangeError && (
                  <p className="text-sm font-medium text-urgent-600">{passwordChangeError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordPanel(false)}
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={changingPassword} className="flex-1">
                    {changingPassword ? 'Saving…' : 'Save new password'}
                  </Button>
                </div>
              </form>
          </div>
        )}
      </div>
    )
  }

  if (view === 'passcode') {
    return (
      <div className="mx-auto max-w-md">
        <CenterToast toast={toast} onDismiss={() => setToast(null)} />
        <button
          onClick={() => setView('list')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          Profile
        </button>
        <h1 className="mb-6 text-xl font-bold text-gray-900">My Reports Passcode</h1>

        <form onSubmit={handlePasscodeSubmit} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          {hasPasscode && (
            <div className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
              Current passcode
              <PinInput
                value={currentPasscode}
                onChange={setCurrentPasscode}
                autoFocus
                complete={currentFilled}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
            New passcode
            <PinInput
              value={newPasscode}
              onChange={setNewPasscode}
              autoFocus={!hasPasscode}
              disabled={hasPasscode && !currentFilled}
              complete={newFilled}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
            Confirm new passcode
            <PinInput
              value={confirmPasscode}
              onChange={setConfirmPasscode}
              disabled={!newFilled}
              complete={confirmFilled}
            />
          </div>

          {passcodeError && <p className="text-sm font-medium text-urgent-600">{passcodeError}</p>}

          <Button type="submit" disabled={passcodeBusy} className="mt-1 w-full">
            {passcodeBusy ? 'Saving…' : hasPasscode ? 'Update passcode' : 'Set passcode'}
          </Button>
        </form>

        {hasPasscode && (
          <div className="mt-4 text-center">
            {passcodeResetRequested ? (
              <p className="text-xs text-gray-400">
                Request sent — your Admin will send a reset through your Inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={requestPasscodeReset}
                disabled={requestingPasscodeReset}
                className="text-xs font-semibold text-brand-600 underline decoration-dotted hover:text-brand-700 disabled:opacity-50"
              >
                {requestingPasscodeReset ? 'Sending…' : 'Forgot your passcode? Ask your Admin for help.'}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <CenterToast toast={toast} onDismiss={() => setToast(null)} />
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
        <User size={20} strokeWidth={2} className="text-brand-800" />
        Profile
      </h1>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-lg font-bold text-brand-800 ring-2 ring-brand-100">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(profile?.full_name)
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            <Camera size={12} strokeWidth={2.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-base font-bold text-gray-900">{profile?.full_name || 'Student'}</p>
            {profile?.contact_number_verified && (
              <BadgeCheck size={16} strokeWidth={2} className="shrink-0 text-brand-600" />
            )}
          </div>
          <p className="truncate text-sm text-gray-400">{user?.email}</p>
          {uploadingAvatar && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
          {avatarError && <p className="mt-1 text-xs font-medium text-urgent-600">{avatarError}</p>}
        </div>
      </div>

      <div className="mb-6 flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button
          onClick={() => setView('personal')}
          className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
        >
          <User size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
          <span className="flex-1 text-sm font-semibold text-gray-800">Personal Information</span>
          <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-300" />
        </button>
        <button
          onClick={openPasscode}
          className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
        >
          <KeyRound size={18} strokeWidth={2} className="shrink-0 text-gray-400" />
          <span className="flex-1 text-sm font-semibold text-gray-800">My Reports Passcode</span>
          <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-300" />
        </button>
      </div>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-urgent-100 bg-urgent-50 px-5 py-3 text-base font-semibold text-urgent-600 transition-colors hover:bg-urgent-100"
      >
        <LogOut size={18} strokeWidth={2} />
        Log Out
      </button>
    </div>
  )
}
