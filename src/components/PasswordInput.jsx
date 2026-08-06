import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

const VARIANTS = {
  light: {
    icon: 'text-gray-400',
    input:
      'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-brand-500',
    toggle: 'text-gray-400 hover:text-gray-600',
  },
  // Dark glass on mobile (matches the splash/login hero), light on desktop.
  auth: {
    icon: 'text-gray-500 lg:text-gray-400',
    input:
      'border-white/10 bg-white/5 text-white placeholder-gray-500 transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 lg:border-gray-300 lg:bg-white lg:text-gray-900 lg:placeholder-gray-400 lg:focus:border-brand-500 lg:focus:ring-0',
    toggle: 'text-gray-500 hover:text-gray-300 lg:text-gray-400 lg:hover:text-gray-600',
  },
}

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required = true,
  variant = 'light',
  placeholder = 'Enter your password',
}) {
  const [visible, setVisible] = useState(false)
  const styles = VARIANTS[variant]

  return (
    <div className="relative">
      <Lock
        size={18}
        strokeWidth={2}
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${styles.icon}`}
      />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border py-3 pl-10 pr-10 text-base focus:outline-none ${styles.input}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${styles.toggle}`}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </button>
    </div>
  )
}
