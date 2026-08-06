import {
  UserPlus,
  Pencil,
  KeyRound,
  Lock,
  UserMinus,
  AlertTriangle,
  ShieldCheck,
  Megaphone,
  Trash2,
  Send,
} from 'lucide-react'

// Shared between the Dashboard's "Recent Activity" widget and the full
// /admin/activity log — every admin action that gets written to audit_log
// should have an entry here so it renders with a real icon/label instead
// of the generic fallback.
export const ACTION_META = {
  create_student: { icon: UserPlus, className: 'bg-brand-100 text-brand-600', label: 'created a student account' },
  edit_student: { icon: Pencil, className: 'bg-brand-100 text-brand-600', label: 'edited a student’s details' },
  reset_student_password: {
    icon: KeyRound,
    className: 'bg-yellow-100 text-yellow-700',
    label: 'reset a student password',
  },
  reset_reports_passcode: {
    icon: Lock,
    className: 'bg-yellow-100 text-yellow-700',
    label: "reset a student's My Reports passcode",
  },
  delete_student: { icon: UserMinus, className: 'bg-urgent-100 text-urgent-600', label: 'deleted a student account' },
  trigger_urgent_warning: {
    icon: AlertTriangle,
    className: 'bg-urgent-100 text-urgent-600',
    label: 'triggered an Urgent Warning',
  },
  deactivate_urgent_warning: {
    icon: ShieldCheck,
    className: 'bg-calm-100 text-calm-600',
    label: 'deactivated the Urgent Warning',
  },
  post_announcement: { icon: Megaphone, className: 'bg-brand-100 text-brand-600', label: 'posted an announcement' },
  delete_announcement: {
    icon: Trash2,
    className: 'bg-urgent-100 text-urgent-600',
    label: 'deleted an announcement',
  },
  send_message: { icon: Send, className: 'bg-brand-100 text-brand-600', label: 'sent a direct message' },
}

export const DEFAULT_ACTION_META = { icon: Pencil, className: 'bg-gray-100 text-gray-500' }

export function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelative(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}
