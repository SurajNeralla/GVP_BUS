import React, { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

// Layouts
import PublicLayout from '@/components/layout/PublicLayout'
import StudentLayout from '@/components/layout/StudentLayout'
import DriverLayout from '@/components/layout/DriverLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Auth pages (eager loaded)
import LoginPage from '@/pages/auth/LoginPage'
import AuthCallback from '@/pages/auth/AuthCallback'
import PendingAssignment from '@/pages/auth/PendingAssignment'

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/pages/public/LandingPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const FAQPage = lazy(() => import('@/pages/public/FAQPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))

// Student
const BusDashboard = lazy(() => import('@/pages/student/BusDashboard'))
const StudentProfilePage = lazy(() => import('@/pages/student/ProfilePage'))
const StudentNotificationsPage = lazy(() => import('@/pages/student/NotificationsPage'))
const StudentRegistrationPage = lazy(() => import('@/pages/student/RegistrationPage'))

// Driver
const DriverDashboard = lazy(() => import('@/pages/driver/DriverDashboard'))
const DriverRoutePage = lazy(() => import('@/pages/driver/DriverRoutePage'))

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminRegistrations = lazy(() => import('@/pages/admin/RegistrationsPage'))
const AdminRoutes = lazy(() => import('@/pages/admin/RoutesPage'))
const AdminBuses = lazy(() => import('@/pages/admin/BusesPage'))
const AdminDrivers = lazy(() => import('@/pages/admin/DriversPage'))
const AdminTracking = lazy(() => import('@/pages/admin/TrackingPage'))
const AdminNotifications = lazy(() => import('@/pages/admin/NotificationsPage'))
const AdminStudents = lazy(() => import('@/pages/admin/StudentsPage'))
const AdminSettings = lazy(() => import('@/pages/admin/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
  },
})

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'hsl(var(--bg-base))' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12L21 12M3 12C3 7.02944 7.02944 3 12 3M3 12C3 16.9706 7.02944 21 12 21M21 12C21 7.02944 16.9706 3 12 3M21 12C21 16.9706 16.9706 21 12 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="w-6 h-6 border-2 border-transparent rounded-full" style={{ borderTopColor: 'hsl(var(--brand-primary))', animation: 'spin 1s linear infinite' }} />
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-red-500/10 p-4 rounded-xl overflow-auto text-sm">{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// -------------------------------------------------------
// Route Guards
// -------------------------------------------------------
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string | string[] }) {
  const { profile, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!profile) return <Navigate to="/login" replace />
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(profile.role)) return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading, assignedBusId } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'student') return <Navigate to="/login" replace />
  if (!assignedBusId) return <Navigate to="/pending" replace />
  return <>{children}</>
}

function AppRouter() {
  useAuth() // Initialize auth & bus assignment on mount

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="pending" element={<PendingAssignment />} />

        {/* Student — Bus-specific dashboards */}
        <Route
          path="bus/:busId"
          element={
            <StudentRoute>
              <StudentLayout />
            </StudentRoute>
          }
        >
          <Route index element={<BusDashboard />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="registration" element={<StudentRegistrationPage />} />
        </Route>

        {/* Driver */}
        <Route
          path="driver"
          element={
            <ProtectedRoute role="driver">
              <DriverLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DriverDashboard />} />
          <Route path="route" element={<DriverRoutePage />} />
        </Route>

        {/* Admin */}
        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="buses" element={<AdminBuses />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="tracking" element={<AdminTracking />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <HashRouter>
          <div className="mesh-bg" />
          <AppRouter />
        </HashRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
