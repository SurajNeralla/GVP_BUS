import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Bell, Send, Loader2, Users, Bus as BusIcon } from 'lucide-react'

const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'announcement'] as const

export default function NotificationsPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement' as const, target: 'all' })
  const [busTarget, setBusTarget] = useState('')

  const { data: buses = [] } = useQuery({
    queryKey: ['all-buses'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('*')
      return data ?? []
    },
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (form.target === 'all') {
        // Get all student IDs
        const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'student')
        const inserts = (profiles ?? []).map((p) => ({
          user_id: p.id, title: form.title, message: form.message, type: form.type,
        }))
        if (inserts.length > 0) await supabase.from('notifications').insert(inserts)
      } else if (form.target === 'bus' && busTarget) {
        // Get students approved on this bus
        const { data: regs } = await supabase
          .from('registrations').select('student_id').eq('bus_id', busTarget).eq('status', 'approved')
        const inserts = (regs ?? []).map((r) => ({
          user_id: r.student_id, title: form.title, message: form.message, type: form.type,
        }))
        if (inserts.length > 0) await supabase.from('notifications').insert(inserts)
      }
    },
    onSuccess: () => {
      setForm({ title: '', message: '', type: 'announcement', target: 'all' })
      qc.invalidateQueries()
    },
  })

  return (
    <div className="p-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
        Send Notifications
      </h1>

      <div className="card-glass p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Title</label>
          <input className="input" placeholder="Announcement title..." value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Message</label>
          <textarea className="input resize-none" rows={4} placeholder="Write your announcement..."
            value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
              {NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Send To</label>
            <select className="input" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
              <option value="all">All Students</option>
              <option value="bus">Specific Bus</option>
            </select>
          </div>
        </div>

        {form.target === 'bus' && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Select Bus</label>
            <select className="input" value={busTarget} onChange={(e) => setBusTarget(e.target.value)}>
              <option value="">Select a bus...</option>
              {buses.map((b: any) => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
            </select>
          </div>
        )}

        <button
          onClick={() => sendMutation.mutate()}
          className="btn-primary w-full py-3 gap-2"
          disabled={sendMutation.isPending || !form.title || !form.message}
        >
          {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Notification</>}
        </button>

        {sendMutation.isSuccess && (
          <p className="text-sm text-center" style={{ color: 'hsl(142 71% 60%)' }}>
            ✓ Notification sent successfully!
          </p>
        )}
      </div>
    </div>
  )
}
