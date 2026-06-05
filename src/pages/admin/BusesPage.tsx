import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X, Loader2, Bus as BusIcon } from 'lucide-react'
import type { Bus, Route } from '@/types'

const BUS_STATUSES = ['active', 'inactive', 'maintenance'] as const
const emptyBus = { bus_number: '', route_id: '', capacity: 50, status: 'inactive' as const }

export default function BusesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Bus | null>(null)
  const [form, setForm] = useState<typeof emptyBus>(emptyBus)

  const { data: buses = [] } = useQuery({
    queryKey: ['admin-buses'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('*, route:routes(*)').order('created_at', { ascending: false })
      return (data ?? []) as (Bus & { route: Route })[]
    },
  })

  const { data: routes = [] } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => {
      const { data } = await supabase.from('routes').select('*')
      return (data ?? []) as Route[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, route_id: form.route_id || null }
      if (editing) await supabase.from('buses').update(payload).eq('id', editing.id)
      else await supabase.from('buses').insert(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-buses'] }); setShowForm(false); setEditing(null); setForm(emptyBus) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('buses').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-buses'] }),
  })

  const openEdit = (b: Bus) => {
    setEditing(b); setForm({ bus_number: b.bus_number, route_id: b.route_id ?? '', capacity: b.capacity, status: b.status as any }); setShowForm(true)
  }

  const statusColors: Record<string, string> = { active: 'badge-approved', inactive: 'badge-not_started', maintenance: 'badge-delayed' }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Buses</h1>
        <button onClick={() => { setEditing(null); setForm(emptyBus); setShowForm(true) }} className="btn-primary px-4 py-2 text-sm gap-2">
          <Plus size={16} /> Add Bus
        </button>
      </div>

      {showForm && (
        <div className="card-glass p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{editing ? 'Edit Bus' : 'Add Bus'}</h2>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'hsl(var(--text-muted))' }} /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Bus Number</label>
              <input className="input" placeholder="AP 05 AB 1234" value={form.bus_number}
                onChange={(e) => setForm((f) => ({ ...f, bus_number: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Capacity</label>
              <input type="number" className="input" value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 50 }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Assign Route</label>
              <select className="input" value={form.route_id} onChange={(e) => setForm((f) => ({ ...f, route_id: e.target.value }))}>
                <option value="">No route</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}>
                {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => saveMutation.mutate()} className="btn-primary px-6 py-2.5 text-sm gap-2" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : editing ? 'Save Changes' : 'Add Bus'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((b) => (
          <div key={b.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                  <BusIcon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{b.bus_number}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Cap: {b.capacity}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
                  <Pencil size={13} style={{ color: 'hsl(var(--brand-primary))' }} />
                </button>
                <button onClick={() => deleteMutation.mutate(b.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                  <Trash2 size={13} style={{ color: 'hsl(0 84% 60%)' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`badge ${statusColors[b.status]}`}>{b.status}</span>
              {b.route && <span className="badge badge-not_started">{(b as any).route.route_name}</span>}
            </div>
          </div>
        ))}
        {buses.length === 0 && (
          <div className="col-span-3 py-12 text-center" style={{ color: 'hsl(var(--text-muted))' }}>No buses yet.</div>
        )}
      </div>
    </div>
  )
}
