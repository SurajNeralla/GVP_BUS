import { Link } from 'react-router-dom'
import { Bus, MapPin, Bell, Shield, Smartphone, Zap, ChevronRight } from 'lucide-react'

const features = [
  { icon: MapPin, title: 'Live GPS Tracking', desc: 'See your bus location in real-time on an interactive map with road-following routes.', color: '#3b82f6' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Instant alerts for route changes, delays, approvals, and announcements.', color: '#8b5cf6' },
  { icon: Shield, title: 'Secure & Verified', desc: 'College email-only access with Supabase authentication and row-level security.', color: '#22c55e' },
  { icon: Smartphone, title: 'Install as App', desc: 'Works offline and can be installed on your phone like a native app.', color: '#f59e0b' },
  { icon: Zap, title: 'Instant Updates', desc: 'Real-time data syncing with Supabase Realtime — no refresh needed.', color: '#ef4444' },
  { icon: Bus, title: 'Bus Dashboards', desc: 'Each bus has its own dedicated dashboard for students assigned to it.', color: '#06b6d4' },
]

const stats = [
  { value: '5+', label: 'Bus Routes' },
  { value: '500+', label: 'Students' },
  { value: '99%', label: 'Uptime' },
  { value: '< 1s', label: 'Location Update' },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(220 90% 56%), transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(262 83% 58%), transparent)' }} />

        <div className="relative z-10 text-center max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'hsl(var(--brand-primary) / 0.12)', color: 'hsl(var(--brand-primary))', border: '1px solid hsl(var(--brand-primary) / 0.2)' }}>
            <span className="live-dot" /> Live Bus Tracking · PWA · Supabase Powered
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            <span style={{ color: 'hsl(var(--text-primary))' }}>GVPCDPGC</span>
            <br />
            <span className="gradient-text">Smart Bus</span>
            <br />
            <span style={{ color: 'hsl(var(--text-primary))' }}>Portal</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: 'hsl(var(--text-secondary))', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Register for college bus routes, track your bus live on the map, and get instant notifications — all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary px-8 py-4 text-base gap-3 rounded-2xl">
              Get Started
              <ChevronRight size={20} />
            </Link>
            <Link to="/about"
              className="px-8 py-4 rounded-2xl text-base font-semibold border transition-all hover:bg-white/5"
              style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="card-glass p-6 text-center">
              <p className="text-4xl font-black gradient-text mb-1" style={{ fontFamily: 'Hanken Grotesk' }}>{value}</p>
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
              Everything you need
            </h2>
            <p className="text-base" style={{ color: 'hsl(var(--text-muted))' }}>
              A complete bus management solution for GVPCDPGC
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 animate-fade-in group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: color + '18' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'hsl(var(--text-primary))' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-glass p-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--gradient-primary)' }}>
              <Bus size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
              Ready to track your bus?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
              Sign in with your college email — no password needed.
            </p>
            <Link to="/login" className="btn-primary px-8 py-3 text-base rounded-xl gap-2 inline-flex">
              Sign In Now <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
