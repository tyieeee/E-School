import { useRef, useState } from 'react'
import { UserCircle, Camera, LogOut, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import CenterToast from '../../components/CenterToast'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_BYTES = 3 * 1024 * 1024
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function initials(name) {
  if (!name) return 'A'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AdminProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loginEmail, setLoginEmail] = useState(user?.email || '')
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [toast, setToast] = useState(null)

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

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError('')

    if (!fullName.trim()) {
      setProfileError('Please enter your name.')
      return
    }
    if (!loginEmail.trim() || !EMAIL_RE.test(loginEmail.trim())) {
      setProfileError('Please enter a valid login email.')
      return
    }

    setSavingProfile(true)

    // Save the profile-table field first — independent of the auth email
    // pipeline below, so a rate limit or SMTP hiccup there can't cost you
    // the name change.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    if (updateError) {
      setSavingProfile(false)
      setProfileError(updateError.message)
      return
    }

    let note = ''
    if (loginEmail.trim() !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: loginEmail.trim() })
      note = emailError
        ? ` Login email was not changed: ${emailError.message}`
        : ' Check your new email to confirm the change.'
    }

    setSavingProfile(false)
    await refreshProfile()
    setToast({ type: note.includes('not changed') ? 'error' : 'success', message: `Saved!${note}` })
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setChangingPassword(true)

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) {
      setChangingPassword(false)
      setPasswordError('Current password is incorrect.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)

    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setToast({ type: 'success', message: 'Password changed.' })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <CenterToast toast={toast} onDismiss={() => setToast(null)} />
      <PageHeader title="Profile" description="Manage your own admin account." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700 ring-2 ring-brand-100">
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
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                <Camera size={13} strokeWidth={2.5} />
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
              <p className="truncate text-base font-bold text-gray-900">{profile?.full_name || 'Admin'}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                Administrator
              </span>
              {uploadingAvatar && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
              {avatarError && <p className="mt-1 text-xs font-medium text-urgent-600">{avatarError}</p>}
            </div>
          </Card>

          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-urgent-100 bg-urgent-50 px-5 py-3 text-sm font-semibold text-urgent-600 transition-colors hover:bg-urgent-100"
          >
            <LogOut size={16} strokeWidth={2} />
            Log Out
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <UserCircle size={16} strokeWidth={2} className="text-brand-600" />
              Personal Information
            </h2>
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Login email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {profileError && <p className="text-sm font-medium text-urgent-600">{profileError}</p>}

              <Button type="submit" disabled={savingProfile} className="mt-1 w-full sm:w-auto">
                {savingProfile ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <KeyRound size={16} strokeWidth={2} className="text-brand-600" />
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none sm:max-w-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">New password</label>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Confirm new password</label>
                  <input
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {passwordError && <p className="text-sm font-medium text-urgent-600">{passwordError}</p>}

              <Button type="submit" variant="secondary" disabled={changingPassword} className="mt-1 w-full sm:w-auto">
                {changingPassword ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
