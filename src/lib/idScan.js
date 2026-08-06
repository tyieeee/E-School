import { createWorker } from 'tesseract.js'

// Words that show up on ID card templates but are never the cardholder's
// name — filtering these out keeps the name-guess heuristic from picking
// a school/label line instead of the actual name.
const LABEL_KEYWORDS = [
  'STUDENT',
  'SCHOOL',
  'UNIVERSITY',
  'COLLEGE',
  'REPUBLIC',
  'IDENTIFICATION',
  'VALID',
  'SIGNATURE',
  'ADDRESS',
  'BIRTH',
  'COURSE',
  'DEPARTMENT',
  'YEAR',
  'SEMESTER',
  'EMERGENCY',
  'CONTACT',
  'BLOOD',
  'GENDER',
  'NATIONALITY',
]

function scoreNameLine(line) {
  const upper = line.toUpperCase()
  if (LABEL_KEYWORDS.some((kw) => upper.includes(kw))) return null

  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5) return null
  if (!words.every((w) => /^[A-Za-z.'-]{2,}$/.test(w))) return null

  const letterRatio = (line.match(/[A-Za-z\s]/g) || []).length / line.length
  if (letterRatio < 0.9) return null

  return words.length + letterRatio
}

function titleCase(words) {
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function parseIdText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let studentNumber = ''
  for (const line of lines) {
    const matches = line.match(/\d[\d\-/]{3,}\d/g) || []
    for (const m of matches) {
      if (m.replace(/\D/g, '').length > studentNumber.replace(/\D/g, '').length) {
        studentNumber = m
      }
    }
  }

  let bestName = ''
  let bestScore = 0
  for (const line of lines) {
    const score = scoreNameLine(line)
    if (score !== null && score > bestScore) {
      bestScore = score
      bestName = titleCase(line.split(/\s+/).filter(Boolean))
    }
  }

  return { name: bestName, studentNumber, rawText }
}

// Runs OCR entirely client-side (no server round-trip, no API key). Accuracy
// depends heavily on photo clarity — this is a best-effort suggestion the
// admin should review, not a guaranteed-correct read.
export async function scanIdImage(file, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return parseIdText(text)
  } finally {
    await worker.terminate()
  }
}

export function generateEmailFromName(name, domain = 'eschool.com') {
  const first = name.trim().split(/\s+/)[0] || ''
  const clean = first.toLowerCase().replace(/[^a-z0-9]/g, '')
  return clean ? `${clean}@${domain}` : ''
}
