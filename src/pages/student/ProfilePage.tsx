import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { User, Phone, Mail, Building2, GraduationCap, Save, Loader2, CheckCircle2 } from 'lucide-react'

export default function ProfilePage() {
  const { profile, setProfile } = useAuthStore()
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setSaved(false); setError('')
    const { data, error: err } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', profile.id)
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setProfile(data as any)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const fields = [
    { icon: User, label: 'Full Name', value: profile?.full_name ?? '—' },
    { icon: Mail, label: 'Email', value: profile?.email ?? '—' },
    { icon: GraduationCap, label: 'Roll Number', value: profile?.roll_number ?? '—' },
    { icon: Building2, label: 'Department', value: profile?.department ?? '—' },
    { icon: GraduationCap, label: 'Year', value: profile?.year ? `Year ${profile.year}` : '—' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
        My Profile
      </h1>

      {/* Avatar */}
      <div className="card-glass p-6 flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {profile?.full_name?.charAt(0) ?? '?'}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: 'hsl(var(--text-primary))' }}>{profile?.full_name ?? 'Student'}</p>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{profile?.email}</p>
          <span className="badge badge-approved mt-1">Student</span>
        </div>
      </div>

      {/* Info cards */}
      <div className="card-glass p-5 space-y-4 mb-5">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--bg-card))' }}>
              <Icon size={15} style={{ color: 'hsl(var(--brand-primary))' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Editable: phone */}
      <div className="card-glass p-5">
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--text-primary))' }}>Update Phone Number</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--bg-card))' }}>
              <Phone size={15} style={{ color: 'hsl(var(--brand-primary))' }} />
            </div>
            <input
              type="tel"
              className="input flex-1"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full py-2.5" disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save</>}
          </button>
        </form>
      </div>
    </div>
  )
}
