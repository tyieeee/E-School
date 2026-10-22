// Tracks, per student, when they last opened the full announcements list —
// used to show an unread-style count badge on the Dashboard that clears
// once they've actually viewed everything.
const KEY_PREFIX = 'eschool_announcements_seen_at:'

export function getAnnouncementsSeenAt(userId) {
  if (!userId) return null
  return localStorage.getItem(KEY_PREFIX + userId)
}

export function markAnnouncementsSeen(userId, timestamp = new Date().toISOString()) {
  if (!userId) return
  localStorage.setItem(KEY_PREFIX + userId, timestamp)
}
