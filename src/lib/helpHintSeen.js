// Tracks, per account, whether the student has already been shown the
// one-time spotlight pointing at the "?" tutorial button on the dashboard.
const KEY_PREFIX = 'eschool_help_hint_seen:'

export function getHelpHintSeen(userId) {
  if (!userId) return true
  return localStorage.getItem(KEY_PREFIX + userId) === '1'
}

export function markHelpHintSeen(userId) {
  if (!userId) return
  localStorage.setItem(KEY_PREFIX + userId, '1')
}
