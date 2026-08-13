import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { TourProvider } from './context/TourContext'
import ProtectedRoute from './components/ProtectedRoute'
import StudentLayout from './components/StudentLayout'
import AdminLayout from './components/AdminLayout'

import Welcome from './pages/student/Welcome'
import StudentLogin from './pages/student/Login'
import ForgotPassword from './pages/student/ForgotPassword'
import ResetPassword from './pages/student/ResetPassword'
import FirstLoginSetup from './pages/student/FirstLoginSetup'
import Tutorial from './pages/student/Tutorial'
import StudentDashboard from './pages/student/Dashboard'
import Report from './pages/student/Report'
import Inbox from './pages/student/Inbox'
import MyReports from './pages/student/MyReports'
import StudentAnnouncements from './pages/student/Announcements'
import StudentSettings from './pages/student/Settings'
import Preferences from './pages/student/Preferences'

import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import Students from './pages/admin/Students'
import Reports from './pages/admin/Reports'
import Announcements from './pages/admin/Announcements'
import Messages from './pages/admin/Messages'
import PasscodeRequests from './pages/admin/PasscodeRequests'
import AdminProfile from './pages/admin/Profile'
import UrgentWarning from './pages/admin/UrgentWarning'
import Activity from './pages/admin/Activity'

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return null
  if (!session || !profile) return <Welcome />
  return <Navigate to={profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <TourProvider>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              <Route path="/login" element={<StudentLogin />} />
              <Route path="/login/adminlogin" element={<AdminLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route element={<ProtectedRoute role="student" />}>
                <Route path="/first-login-setup" element={<FirstLoginSetup />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route element={<StudentLayout />}>
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/my-reports" element={<MyReports />} />
                  <Route path="/announcements" element={<StudentAnnouncements />} />
                  <Route path="/settings" element={<StudentSettings />} />
                  <Route path="/preferences" element={<Preferences />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute role="admin" />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/students" element={<Students />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/announcements" element={<Announcements />} />
                  <Route path="/admin/messages" element={<Messages />} />
                  <Route path="/admin/passcode-requests" element={<PasscodeRequests />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  <Route path="/admin/urgent-warning" element={<UrgentWarning />} />
                  <Route path="/admin/activity" element={<Activity />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TourProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
