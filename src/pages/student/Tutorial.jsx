import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Lock, Inbox } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { markTutorialSeen } from '../../lib/tutorialSeen'
import BrandMark from '../../components/BrandMark'

const STEPS = [
  {
    icon: Megaphone,
    tag: 'REPORT',
    title: 'Speak up, safely',
    description:
      "Tell us what's happening in a few taps. Your identity stays protected while your Admin reviews it.",
  },
  {
    icon: Lock,
    tag: 'TRACK',
    title: 'Follow your reports',
    description: "Open My Reports anytime to see the status of everything you've submitted.",
  },
  {
    icon: Inbox,
    tag: 'CONNECT',
    title: 'Stay in the loop',
    description: 'Get replies in your Inbox and catch important Announcements from your school.',
  },
]

export default function Tutorial() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const isLastStep = step === STEPS.length - 1
  const current = STEPS[step]

  function finish() {
    markTutorialSeen(user?.id)
    navigate('/dashboard', { replace: true })
  }

  function handleContinue() {
    if (isLastStep) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 px-6 py-6">
      <div className="flex items-center justify-between">
        <BrandMark />
        <button
          onClick={finish}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 shadow-xl shadow-brand-900/25">
          <current.icon size={56} strokeWidth={1.75} className="text-white" />
        </div>

        <p className="mt-8 text-xs font-bold tracking-wider text-brand-600">{current.tag}</p>
        <h1 className="mt-2 text-2xl font-extrabold text-gray-900">{current.title}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">{current.description}</p>
      </div>

      <div className="mb-2 flex items-center justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.tag}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-brand-200'
            }`}
          />
        ))}
      </div>

      <div className="mx-auto w-full max-w-xs">
        <button
          onClick={handleContinue}
          className="w-full rounded-full bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/25 transition-colors hover:bg-brand-600"
        >
          {isLastStep ? 'Get started' : 'Continue'}
        </button>
        <p className="mt-3 text-center text-xs text-gray-400">
          Your identity stays protected in every report.
        </p>
      </div>
    </div>
  )
}
