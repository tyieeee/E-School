const GROUP_GAP_MS = 10 * 60 * 1000

// Groups consecutive messages from the same sender together — a new group
// only starts when the sender changes or more than 10 minutes pass since
// the previous message, so a burst of texts reads like one message instead
// of repeating the avatar/name/timestamp for every line.
export function groupMessages(messages) {
  const groups = []
  for (const m of messages) {
    const lastGroup = groups[groups.length - 1]
    const lastMessage = lastGroup?.messages[lastGroup.messages.length - 1]
    const gapMs = lastMessage ? new Date(m.created_at) - new Date(lastMessage.created_at) : Infinity
    if (lastGroup && lastGroup.senderId === m.sender_id && gapMs <= GROUP_GAP_MS) {
      lastGroup.messages.push(m)
    } else {
      groups.push({ senderId: m.sender_id, messages: [m] })
    }
  }
  return groups
}
