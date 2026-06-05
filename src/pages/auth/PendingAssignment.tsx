import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle2, User, Loader2, Bus } from 'lucide-react'

const DEPARTMENTS = ['BCA', 'BSc CS', 'BSc IT', 'BBA', 'BCom', 'BA', 'Other']

export default function PendingAssignment() {
  const [searchParams] = useSearchParams()
  const isSetup = searchParams.get('setup') === '1'
  const { profile, setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    roll_number: profile?.roll_number ?? '',
    phone: profile?.phone ?? '',
    department: profile?.department ?? '',
    year: profile?.year?.toString() ?? '1',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          roll_number: form.roll_number.toUpperCase(),
          phone: form.phone,
          department: form.department,
          year: parseInt(form.year),
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (dbErr) throw dbErr

      // Create a pending registration request for the Admin to review
      const { error: regErr } = await supabase
        .from('registrations')
        .insert({ student_id: profile.id, status: 'pending' })
        
      if (regErr && regErr.code !== '23505') {
        throw regErr
      }

      setProfile(data as any)
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
            <Bus size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif', color: 'hsl(var(--text-primary))' }}>
            {isSetup ? 'Complete Your Profile' : 'Waiting for Bus Assignment'}
          </h1>
        </div>

        {isSetup || !saved ? (
          <div className="card-glass p-6">
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: 'hsl(var(--brand-primary) / 0.1)' }}>
              <User size={18} style={{ color: 'hsl(var(--brand-primary))' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
                {isSetup ? 'Fill in your details to complete setup.' : 'Your bus assignment is pending admin approval.'}
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', placeholder: 'Your full name', type: 'text' },
                { label: 'Roll Number', key: 'roll_number', placeholder: '23BCA001', type: 'text' },
                { label: 'Phone Number', key: 'phone', placeholder: '+91 9876543210', type: 'tel' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>{label}</label>
                  <input
                    type={type}
                    className="input"
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Department</label>
                <select
                  className="input"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  required
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Year</label>
                <select className="input" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
                  {['1', '2', '3'].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card-glass p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(38 92% 50% / 0.15)' }}>
              <Clock size={32} style={{ color: 'hsl(38 92% 65%)' }} />
            </div>
            <h2 className="font-bold text-lg mb-2" style={{ color: 'hsl(var(--text-primary))' }}>Profile Saved!</h2>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-secondary))' }}>
              The admin will assign you to a bus shortly. You'll receive an email and notification when you're assigned.
            </p>
            <div className="p-4 rounded-xl text-sm space-y-2" style={{ background: 'hsl(var(--bg-card))' }}>
              <p style={{ color: 'hsl(var(--text-muted))' }}>Registered as:</p>
              <p className="font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{profile?.full_name}</p>
              <p style={{ color: 'hsl(var(--text-secondary))' }}>{profile?.email}</p>
            </div>
            <p className="text-xs mt-4" style={{ color: 'hsl(var(--text-muted))' }}>
              Check this page again after your admin approves.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
