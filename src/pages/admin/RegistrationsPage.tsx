import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Search, CheckCircle2, XCircle, Clock, ChevronDown, Download, Bus as BusIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { RegistrationStatus } from '@/types'

const STATUS_OPTS: RegistrationStatus[] = ['pending', 'approved', 'rejected']

export default function RegistrationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assignBusMap, setAssignBusMap] = useState<Record<string, string>>({})

  const { data: registrations = [] } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('registrations')
        .select('*, profile:profiles(*), route:routes(*), bus:buses(*)')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: buses = [] } = useQuery({
    queryKey: ['all-buses'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('*, route:routes(*)').eq('status', 'active')
      return data ?? []
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, bus_id, remarks }: { id: string; status: RegistrationStatus; bus_id?: string; remarks?: string }) => {
      const updateData: any = { status }
      if (bus_id) {
        updateData.bus_id = bus_id
        const assignedBus = buses.find((b: any) => b.id === bus_id)
        if (assignedBus?.route_id) updateData.route_id = assignedBus.route_id
      }
      if (remarks) updateData.remarks = remarks
      await supabase.from('registrations').update(updateData).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-registrations'] }),
  })

  const filtered = registrations.filter((r: any) => {
    const s = statusFilter === 'all' || r.status === statusFilter
    const q = !search || [r.profile?.full_name, r.profile?.roll_number, r.profile?.email]
      .join(' ').toLowerCase().includes(search.toLowerCase())
    return s && q
  })

  const exportCSV = () => {
    const rows = [
      ['Name', 'Roll No', 'Email', 'Route', 'Bus', 'Status', 'Date'],
      ...filtered.map((r: any) => [
        r.profile?.full_name, r.profile?.roll_number, r.profile?.email,
        r.route?.route_name, r.bus?.bus_number, r.status,
        new Date(r.created_at).toLocaleDateString(),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'registrations.csv'
    a.click()
  }

  const statusCfg = {
    pending: { icon: Clock, cls: 'badge-pending' },
    approved: { icon: CheckCircle2, cls: 'badge-approved' },
    rejected: { icon: XCircle, cls: 'badge-rejected' },
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
          Registrations
        </h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
          style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 input">
          <Search size={15} style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm"
            style={{ color: 'hsl(var(--text-primary))' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', ...STATUS_OPTS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                borderColor: statusFilter === s ? 'hsl(var(--brand-primary))' : 'hsl(var(--border-subtle))',
                background: statusFilter === s ? 'hsl(var(--brand-primary) / 0.1)' : 'transparent',
                color: statusFilter === s ? 'hsl(var(--brand-primary))' : 'hsl(var(--text-secondary))',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Student', 'Roll No', 'Route', 'Bus', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => {
                const { icon: StatusIcon, cls } = statusCfg[r.status as RegistrationStatus] ?? statusCfg.pending
                const isExpanded = expandedId === r.id
                return (
                  <>
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'var(--gradient-primary)' }}>
                            {r.profile?.full_name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{r.profile?.full_name}</p>
                            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{r.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{r.profile?.roll_number}</td>
                      <td className="text-sm">{r.route?.route_name ?? '—'}</td>
                      <td className="text-sm">{r.bus?.bus_number ?? <span style={{ color: 'hsl(var(--text-muted))' }}>Unassigned</span>}</td>
                      <td><span className={`badge ${cls}`}><StatusIcon size={11} />{r.status}</span></td>
                      <td className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </td>
                      <td>
                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          className="flex items-center gap-1 text-xs font-medium transition-all"
                          style={{ color: 'hsl(var(--brand-primary))' }}>
                          Actions <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-expand`}>
                        <td colSpan={7}>
                          <div className="p-4 rounded-xl m-2 space-y-3" style={{ background: 'hsl(var(--bg-elevated))' }}>
                            {/* Bus assignment */}
                            <div className="flex items-center gap-3">
                              <BusIcon size={15} style={{ color: 'hsl(var(--brand-primary))' }} />
                              <select
                                className="input flex-1 text-sm py-1.5"
                                value={assignBusMap[r.id] ?? r.bus_id ?? ''}
                                onChange={(e) => setAssignBusMap((m) => ({ ...m, [r.id]: e.target.value }))}
                              >
                                <option value="">Select bus to assign</option>
                                {buses.map((b: any) => (
                                  <option key={b.id} value={b.id}>
                                    {b.bus_number} {b.route ? `— Route: ${b.route.route_name}` : ''} (cap: {b.capacity})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => updateMutation.mutate({ id: r.id, status: 'approved', bus_id: assignBusMap[r.id] })}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                                style={{ background: 'hsl(142 71% 45%)' }}
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                onClick={() => updateMutation.mutate({ id: r.id, status: 'rejected', remarks: 'Rejected by admin' })}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                                style={{ background: 'hsl(0 84% 60%)' }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: 'hsl(var(--text-muted))' }}>No registrations found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
