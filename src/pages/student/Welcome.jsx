import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import RadiatingBadge from '../../components/RadiatingBadge'

const TRANSITION_MS = 900

export default function Welcome() {
  const navigate = useNavigate()
  const [entering, setEntering] = useState(false)

  function handleContinue() {
    if (entering) return
    setEntering(true)
    setTimeout(() => navigate('/login'), TRANSITION_MS)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-slate-950 px-6 py-12 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-calm-500/10 blur-3xl" />

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div
          className="transition-transform ease-out"
          style={{
            transform: entering ? 'translateY(-6%) scale(1.25)' : 'translateY(0) scale(1)',
            transitionDuration: entering ? '850ms' : '300ms',
          }}
        >
          <RadiatingBadge size={240} orbSize={144}>
            <Check size={56} strokeWidth={2.5} className="text-white" />
          </RadiatingBadge>
        </div>

        <div
          className={`mt-5 flex items-center gap-2 transition-opacity duration-300 ${
            entering ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          </span>
          <span className="text-xl font-extrabold text-white">E-School</span>
        </div>

        <p
          className={`mt-6 text-sm text-gray-400 transition-opacity duration-300 ${
            entering ? 'opacity-0' : 'opacity-100'
          }`}
        >
          stay safe, stay connected
        </p>
      </div>

      <div
        className={`relative w-full max-w-xs pb-4 transition-opacity duration-300 ${
          entering ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <button
          onClick={handleContinue}
          className="w-full rounded-full bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/40 transition-colors hover:bg-brand-600"
        >
          Get started
        </button>
        <p className="mt-4 text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={handleContinue} className="font-semibold text-brand-400">
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
