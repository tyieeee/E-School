import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { markTutorialSeen } from '../lib/tutorialSeen'
import { TOUR_STEPS } from '../lib/tourSteps'

const TourContext = createContext(undefined)

// This guided tour is manual-only (launched via the "?" button) — the
// static 3-step Tutorial page shown right after first login already covers
// auto-onboarding a brand-new student, so this doesn't also auto-launch
// itself (the two would otherwise race for the same tutorialSeen flag).
export function TourProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const goToStep = useCallback(
    (index) => {
      const target = TOUR_STEPS[index]
      if (target.path !== location.pathname) navigate(target.path)
      setStepIndex(index)
    },
    [navigate, location.pathname]
  )

  const start = useCallback(() => {
    setActive(true)
    goToStep(0)
  }, [goToStep])

  const finish = useCallback(() => {
    setActive(false)
    if (user?.id) markTutorialSeen(user.id)
  }, [user?.id])

  const next = useCallback(() => {
    const nextIndex = stepIndex + 1
    if (nextIndex >= TOUR_STEPS.length) {
      finish()
      return
    }
    goToStep(nextIndex)
  }, [stepIndex, goToStep, finish])

  const back = useCallback(() => {
    if (stepIndex === 0) return
    goToStep(stepIndex - 1)
  }, [stepIndex, goToStep])

  const value = {
    active,
    step: active ? TOUR_STEPS[stepIndex] : null,
    stepIndex,
    total: TOUR_STEPS.length,
    start,
    next,
    back,
    finish,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (ctx === undefined) throw new Error('useTour must be used within a TourProvider')
  return ctx
}
