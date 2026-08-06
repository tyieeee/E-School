import { Check } from 'lucide-react'
import RadiatingBadge from './RadiatingBadge'

function Wordmark({ size = 'sm' }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex items-center justify-center rounded-full bg-white ${size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`}
      >
        <span className={`rounded-full bg-brand-600 ${size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2'}`} />
      </span>
      <span className={`font-extrabold tracking-tight text-white ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        E-School
      </span>
    </div>
  )
}

export default function AuthSplitLayout({ children }) {
  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile: dark, radiating-badge look — vertically centered, elevated glass form */}
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 px-6 py-10 lg:hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-calm-500/10 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-center">
          <div className="animate-fade-in-up mb-8 flex flex-col items-center gap-3">
            <RadiatingBadge size={160} orbSize={100}>
              <Check size={38} strokeWidth={2.5} className="text-white" />
            </RadiatingBadge>
            <Wordmark />
          </div>

          <div className="animate-fade-in-up-delayed mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-xl shadow-black/20 backdrop-blur-sm">
            {children}
          </div>

          <p className="animate-fade-in-up-delayed mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-gray-500">
            By using this service, you understood and agree to the E-School Terms of Use and
            Privacy Statement.
          </p>
        </div>
      </div>

      {/* Desktop: side-by-side split */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 px-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-calm-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          <RadiatingBadge size={220} orbSize={124}>
            <Check size={46} strokeWidth={2.5} className="text-white" />
          </RadiatingBadge>
          <Wordmark size="lg" />
          <p className="max-w-xs text-sm leading-relaxed text-brand-100">
            A safe, private way to stay connected with your school.
          </p>
        </div>
      </div>

      <div className="hidden w-1/2 flex-col items-center justify-center bg-white px-6 py-12 lg:flex">
        <div className="w-full max-w-sm">
          {children}
          <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
            By using this service, you understood and agree to the E-School Terms of Use and
            Privacy Statement.
          </p>
        </div>
      </div>
    </div>
  )
}
