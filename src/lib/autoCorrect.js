// Reactive typo-correction for the report description — students often
// type in a hurry when something urgent is happening ("tsyo" -> "tayo").
// This is a small curated dictionary + edit-distance match, not a real
// spellchecker, so it only catches close, common misspellings.
const DICTIONARY = [
  // pronouns / connectors
  'ako', 'ikaw', 'siya', 'kami', 'tayo', 'sila', 'ito', 'iyon', 'iyan',
  'niya', 'nila', 'namin', 'natin', 'ninyo', 'kanila', 'akin', 'iyo', 'kanya',
  'atin', 'amin', 'inyo', 'ang', 'nang', 'kapag', 'dahil', 'kasi', 'para',
  'pero', 'kaya', 'lamang', 'opo', 'yung', 'yan', 'dito', 'doon', 'diyan',
  'kanina', 'saan', 'sino', 'ano', 'bakit', 'paano', 'kailan',
  // common verbs
  'nagbully', 'nambully', 'binully', 'sinaktan', 'kinuha', 'ninakaw',
  'nahuli', 'nakita', 'narinig', 'sinabi', 'ginawa', 'nangyari', 'tumakbo',
  'umiyak', 'nagsumbong', 'sumigaw', 'tinakot', 'binastos', 'sinapak',
  'sinuntok', 'sinipa', 'kinagat', 'itinulak', 'sinampal',
  // nouns
  'kaibigan', 'kasama', 'kaklase', 'guro', 'titser', 'teacher', 'estudyante',
  'paaralan', 'eskwela', 'classroom', 'banyo', 'palaruan', 'kanto', 'gate',
  'hallway', 'pasilyo', 'bully', 'bullying', 'sandata', 'weapon', 'patalim',
  'kutsilyo', 'baril', 'classmate', 'friend',
  // misc
  'tulong', 'saklolo', 'takot', 'natakot', 'ngayon', 'kahapon', 'bukas',
  'oras', 'araw', 'umaga', 'tanghali', 'hapon', 'gabi', 'lunch', 'recess',
  'dismissal', 'school', 'help', 'scared', 'hurt', 'today', 'yesterday',
  'tomorrow',
]

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

function matchCase(original, corrected) {
  return /^[A-Z]/.test(original) ? corrected[0].toUpperCase() + corrected.slice(1) : corrected
}

function correctWord(word) {
  const lower = word.toLowerCase()
  if (lower.length < 3 || DICTIONARY.includes(lower)) return word

  let best = null
  let bestDist = Infinity
  for (const candidate of DICTIONARY) {
    if (Math.abs(candidate.length - lower.length) > 2) continue
    const dist = levenshtein(lower, candidate)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }

  const threshold = lower.length <= 4 ? 1 : 2
  return best && bestDist <= threshold ? matchCase(word, best) : word
}

// Given a textarea's current value and cursor position, if the character
// right before the cursor is the space the user just typed, corrects the
// word before that space. Returns the (possibly unchanged) text and where
// the cursor should end up.
export function autoCorrectOnSpace(value, cursorPos) {
  if (cursorPos === 0 || value[cursorPos - 1] !== ' ') return { text: value, cursor: cursorPos }

  let start = cursorPos - 2
  while (start >= 0 && value[start] !== ' ' && value[start] !== '\n') start -= 1
  start += 1

  const word = value.slice(start, cursorPos - 1)
  if (!word) return { text: value, cursor: cursorPos }

  const corrected = correctWord(word)
  if (corrected === word) return { text: value, cursor: cursorPos }

  const text = value.slice(0, start) + corrected + value.slice(cursorPos - 1)
  return { text, cursor: cursorPos + (corrected.length - word.length) }
}
