import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { Bus, Bell, User, MapPin, FileText, LogOut, Home } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/authStore'

export default function StudentLayout() {
  const { busId } = useParams<{ busId: string }>()
  const { signOut } = useAuth()
  const { profile } = useAuthStore()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const base = `/bus/${busId}`

  const navItems = [
    { to: base, icon: Home, label: 'Dashboard', end: true },
    { to: `${base}/notifications`, icon: Bell, label: 'Alerts', badge: unreadCount },
    { to: `${base}/profile`, icon: User, label: 'Profile' },
    { to: `${base}/registration`, icon: FileText, label: 'Registration' },
  ]

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top bar (desktop) */}
      <header className="glass sticky top-0 z-40 h-16 flex items-center justify-between px-6 md:px-8 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Bus size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none" style={{ color: 'hsl(var(--text-primary))' }}>GVPCDPGC Bus Portal</p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>{profile?.full_name ?? profile?.roll_number}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} relative`
              }
            >
              <Icon size={16} />
              {label}
              {badge ? (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-xs font-bold flex items-center justify-center rounded-full text-white" style={{ background: 'var(--gradient-danger)' }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </NavLink>
          ))}
          <button onClick={handleSignOut} className="sidebar-item ml-2 text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={16} />
            Sign Out
          </button>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav md:hidden flex items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                isActive ? 'text-blue-400' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-500/15' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-medium">{label}</span>
                {badge ? (
                  <span className="absolute top-1 right-1 w-4 h-4 text-xs font-bold flex items-center justify-center rounded-full text-white" style={{ background: 'var(--gradient-danger)' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
        <button onClick={handleSignOut} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-red-400">
          <div className="p-1.5 rounded-xl">
            <LogOut size={20} />
          </div>
          <span className="text-xs font-medium">Out</span>
        </button>
      </nav>
    </div>
  )
}
