import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Plus, Loader2, X, UserCog } from 'lucide-react'

export default function DriversPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', bus_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('drivers')
        .select('*, profile:profiles(*), bus:buses(*)')
      return data ?? []
    },
  })

  const { data: buses = [] } = useQuery({
    queryKey: ['all-buses'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('*')
      return data ?? []
    },
  })

  const assignMutation = useMutation({
    mutationFn: async ({ driverId, busId }: { driverId: string; busId: string }) => {
      await supabase.from('drivers').update({ bus_id: busId || null }).eq('id', driverId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-drivers'] }),
  })

  const createDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const email = form.email.toLowerCase().trim()
      
      // 1. Create the Auth User with Supabase Admin client
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: form.password,
        email_confirm: true,
        user_metadata: { role: 'driver', full_name: form.full_name }
      })
      
      if (authErr) throw authErr
      if (!authData?.user) throw new Error('User creation failed.')

      const userId = authData.user.id

      // 2. Wait a moment for the database trigger to auto-create the profile
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Update the profile with extra details (phone) using Admin client
      await supabaseAdmin
        .from('profiles')
        .update({ phone: form.phone, role: 'driver', full_name: form.full_name })
        .eq('id', userId)

      // 4. Create the driver record
      const { error: insertErr } = await supabaseAdmin
        .from('drivers')
        .insert({ profile_id: userId, bus_id: form.bus_id || null })

      if (insertErr) {
        if (insertErr.code === '23505') throw new Error('This user is already a driver.')
        throw insertErr
      }

      qc.invalidateQueries({ queryKey: ['admin-drivers'] })
      setShowForm(false)
      setForm({ full_name: '', email: '', phone: '', password: '', bus_id: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Drivers</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 text-sm gap-2">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {showForm && (
        <div className="card-glass p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create Driver Account</h2>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
          </div>
          <form onSubmit={createDriver} className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Driver Name' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'driver@gvpcdpgc.edu.in' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 9876543210' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>{label}</label>
                <input type={type} className="input" placeholder={placeholder}
                  value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Assign Bus (optional)</label>
              <select className="input" value={form.bus_id} onChange={(e) => setForm((f) => ({ ...f, bus_id: e.target.value }))}>
                <option value="">No bus assigned yet</option>
                {buses.map((b: any) => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
              </select>
            </div>
            {error && <p className="md:col-span-2 text-xs text-red-400">{error}</p>}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary px-6 py-2.5 text-sm" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Create Driver'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d: any) => (
          <div key={d.id} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: 'var(--gradient-success)' }}>
                {d.profile?.full_name?.charAt(0) ?? 'D'}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>{d.profile?.full_name ?? '—'}</p>
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{d.profile?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Assigned Bus</p>
              <select
                className="input py-1.5 text-xs"
                value={d.bus_id ?? ''}
                onChange={(e) => assignMutation.mutate({ driverId: d.id, busId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {buses.map((b: any) => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
              </select>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="col-span-3 py-12 text-center" style={{ color: 'hsl(var(--text-muted))' }}>
            <UserCog size={32} className="mx-auto mb-3 opacity-30" />
            No drivers yet.
          </div>
        )}
      </div>
    </div>
  )
}
