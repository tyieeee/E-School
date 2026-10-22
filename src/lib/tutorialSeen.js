// Tracks, per student, whether they've completed or skipped the post-login
// onboarding tutorial — so it only shows once per account per browser.
const KEY_PREFIX = 'eschool_tutorial_seen:'

export function getTutorialSeen(userId) {
  if (!userId) return true
  return localStorage.getItem(KEY_PREFIX + userId) === '1'
}

export function markTutorialSeen(userId) {
  if (!userId) return
  localStorage.setItem(KEY_PREFIX + userId, '1')
}
