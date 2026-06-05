import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Bus, Map, LogOut, Navigation } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

export default function DriverLayout() {
  const { signOut } = useAuth()
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/driver', icon: Bus, label: 'Dashboard', end: true },
    { to: '/driver/route', icon: Map, label: 'Route' },
  ]

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="glass sticky top-0 z-40 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-success)' }}>
            <Navigation size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Driver Portal</p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{profile?.full_name}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <button onClick={handleSignOut} className="sidebar-item text-red-400 hover:bg-red-500/10">
            <LogOut size={16} /> Sign Out
          </button>
        </nav>
      </header>

      <main className="flex-1 pb-6">
        <Outlet />
      </main>
    </div>
  )
}
