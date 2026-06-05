import { Outlet, Link, useLocation } from 'react-router-dom'
import { Bus, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function PublicLayout() {
  const { pathname } = useLocation()
  const { profile } = useAuthStore()

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="glass sticky top-0 z-40 h-16 flex items-center px-6 md:px-10">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Bus size={18} className="text-white" />
          </div>
          <span className="gradient-text hidden sm:block">GVPCDPGC Bus</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            {[['/', 'Home'], ['/about', 'About'], ['/faq', 'FAQ'], ['/contact', 'Contact']].map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: pathname === href ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                  background: pathname === href ? 'hsl(var(--bg-card))' : 'transparent',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
          {profile ? (
            <Link to={profile.role === 'admin' ? '/admin' : profile.role === 'driver' ? '/driver' : '/pending'} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <User size={16} /> Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-4 py-2">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8 px-6 text-center text-sm" style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-muted))' }}>
        © 2025 GVPCDPGC Smart Bus Portal · Built for Students, by Technology
      </footer>
    </div>
  )
}
