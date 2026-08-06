// One-way hash so the raw passcode is never stored — only compared by
// hash. This just needs to stop a classmate from casually reading someone
// else's report history, not withstand a serious attacker.
export async function hashPasscode(pin) {
  const bytes = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
