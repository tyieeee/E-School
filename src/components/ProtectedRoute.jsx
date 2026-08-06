import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  )
}

export default function ProtectedRoute({ role }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />

  const loginPath = role === 'admin' ? '/login/adminlogin' : '/login'

  if (!session || !profile) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  if (profile.role === 'student' && profile.must_change_password && location.pathname !== '/first-login-setup') {
    return <Navigate to="/first-login-setup" replace />
  }

  if (
    profile.role === 'student' &&
    !profile.must_change_password &&
    location.pathname === '/first-login-setup'
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
