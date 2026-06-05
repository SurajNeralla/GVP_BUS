import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, Route, Bus, UserCog, Map, Bell, Settings, LogOut, Shield, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/registrations', icon: ClipboardList, label: 'Registrations' },
  { to: '/admin/routes', icon: Route, label: 'Routes' },
  { to: '/admin/buses', icon: Bus, label: 'Buses' },
  { to: '/admin/drivers', icon: UserCog, label: 'Drivers' },
  { to: '/admin/tracking', icon: Map, label: 'Live Tracking' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh flex">
      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none gradient-text" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Admin Panel</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>GVPCDPGC Bus Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid hsl(var(--border-subtle))' }}>
            <button onClick={handleSignOut} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="glass sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'hsl(var(--bg-card))' }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-semibold text-sm gradient-text">Admin Panel</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
