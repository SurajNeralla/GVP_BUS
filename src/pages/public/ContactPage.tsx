import { Mail, MapPin, Phone } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Contact Us</h1>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Get in touch with the transport office</p>
      </div>
      <div className="card-glass p-8 space-y-5">
        {[
          { icon: MapPin, label: 'Address', value: 'GVP College of Degree & PG Courses, MVP Colony, Visakhapatnam, AP 530017' },
          { icon: Mail, label: 'Email', value: 'transport@gvpcdpgc.edu.in' },
          { icon: Phone, label: 'Phone', value: '+91 891 XXX XXXX' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--brand-primary) / 0.1)' }}>
              <Icon size={18} style={{ color: 'hsl(var(--brand-primary))' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'hsl(var(--text-muted))' }}>{label}</p>
              <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
