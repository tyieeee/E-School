import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RadiatingBadge from '../../components/RadiatingBadge'
import BrandMark from '../../components/BrandMark'

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
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-brand-50 px-6 py-12 text-center">
      <BrandMark className="fixed left-4 top-4 z-20" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-calm-200/30 blur-3xl" />

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div
          className="transition-transform ease-out"
          style={{
            transform: entering ? 'translateY(-6%) scale(1.25)' : 'translateY(0) scale(1)',
            transitionDuration: entering ? '850ms' : '300ms',
          }}
        >
          <RadiatingBadge size={240} orbSize={144} />
        </div>

        <p
          className={`mt-6 text-sm text-gray-500 transition-opacity duration-300 ${
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
        <p className="mt-4 text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={handleContinue} className="font-semibold text-brand-600">
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
