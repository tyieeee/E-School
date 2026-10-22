import RadiatingBadge from './RadiatingBadge'
import BrandMark from './BrandMark'

export default function AuthSplitLayout({ children }) {
  return (
    <div className="min-h-screen lg:flex">
      <BrandMark className="fixed left-4 top-4 z-20" />

      {/* Mobile: vertically centered, elevated card form — matches the light Dashboard look */}
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-50 px-6 py-10 lg:hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-calm-200/30 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-center">
          <div className="animate-fade-in-up mb-8 flex flex-col items-center gap-3">
            <RadiatingBadge size={160} orbSize={100} />
          </div>

          <div className="animate-fade-in-up-delayed mx-auto w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            {children}
          </div>

          <p className="animate-fade-in-up-delayed mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-gray-400">
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
          <RadiatingBadge size={220} orbSize={124} />
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
