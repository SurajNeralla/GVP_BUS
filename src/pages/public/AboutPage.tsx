import { Bus, GraduationCap, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
          <Bus size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>About</h1>
      </div>
      <div className="card-glass p-8 space-y-6">
        <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.8' }}>
          The <strong style={{ color: 'hsl(var(--text-primary))' }}>GVPCDPGC Smart Bus Portal</strong> is a production-ready Progressive Web Application designed to simplify bus transportation management for GVP College of Degree & PG Courses, Visakhapatnam.
        </p>
        <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.8' }}>
          Students can sign in with their college email, get assigned to a bus by the admin, and track their bus live on an interactive map powered by OpenStreetMap and real-time GPS updates from the driver's device.
        </p>
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          {[
            { icon: GraduationCap, title: 'Built for Students', desc: 'Simple sign-in, no password, instant bus dashboard.' },
            { icon: Heart, title: 'Open Source Tech', desc: 'React, Supabase, Leaflet, Tailwind — modern stack.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-4">
              <Icon size={20} className="mb-2" style={{ color: 'hsl(var(--brand-primary))' }} />
              <p className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--text-primary))' }}>{title}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
