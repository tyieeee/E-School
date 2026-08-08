import { useRef } from 'react'

export default function PinInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  complete = false,
}) {
  const inputsRef = useRef([])

  function setDigit(index, digit) {
    const chars = value.split('')
    chars[index] = digit
    onChange(chars.join('').slice(0, length))
  }

  function handleChange(index, e) {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setDigit(index, '')
      return
    }

    const chars = value.split('')
    for (let i = 0; i < raw.length && index + i < length; i++) {
      chars[index + i] = raw[i]
    }
    onChange(chars.join('').slice(0, length))
    inputsRef.current[Math.min(index + raw.length, length - 1)]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (value[index]) {
        setDigit(index, '')
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        setDigit(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div
      className={`flex justify-center gap-2 rounded-2xl border p-3 transition-colors ${
        complete ? 'border-calm-500 bg-calm-50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`h-12 w-11 rounded-xl border text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 disabled:opacity-50 ${
            complete
              ? 'border-calm-500 bg-white focus:border-calm-500 focus:ring-calm-500/20'
              : 'border-gray-200 bg-white focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />
      ))}
    </div>
  )
}
