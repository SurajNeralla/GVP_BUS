import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Users, Route, Bus, ClipboardList, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, routes, buses, regs] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('routes').select('id', { count: 'exact', head: true }),
        supabase.from('buses').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('status'),
      ])
      const regData = regs.data ?? []
      return {
        students: profiles.count ?? 0,
        routes: routes.count ?? 0,
        buses: buses.count ?? 0,
        total: regData.length,
        pending: regData.filter((r) => r.status === 'pending').length,
        approved: regData.filter((r) => r.status === 'approved').length,
        rejected: regData.filter((r) => r.status === 'rejected').length,
      }
    },
  })

  const { data: routeStats } = useQuery({
    queryKey: ['admin-route-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('registrations')
        .select('route_id, status, route:routes(route_name)')
        .eq('status', 'approved')
      const grouped: Record<string, { name: string; count: number }> = {}
      for (const r of data ?? []) {
        const name = (r.route as any)?.route_name ?? 'Unknown'
        if (!grouped[name]) grouped[name] = { name, count: 0 }
        grouped[name].count++
      }
      return Object.values(grouped)
    },
  })

  const pieData = stats
    ? [
        { name: 'Approved', value: stats.approved },
        { name: 'Pending', value: stats.pending },
        { name: 'Rejected', value: stats.rejected },
      ]
    : []

  const statCards = [
    { label: 'Total Students', value: stats?.students ?? 0, icon: Users, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', glow: 'rgba(59,130,246,0.3)' },
    { label: 'Routes', value: stats?.routes ?? 0, icon: Route, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', glow: 'rgba(34,197,94,0.3)' },
    { label: 'Buses', value: stats?.buses ?? 0, icon: Bus, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.3)' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #22c55e, #059669)', glow: 'rgba(34,197,94,0.3)' },
    { label: 'Registrations', value: stats?.total ?? 0, icon: ClipboardList, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', glow: 'rgba(99,102,241,0.3)' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
          GVPCDPGC Smart Bus Portal overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
        {statCards.map(({ label, value, icon: Icon, gradient, glow }) => (
          <div key={label} className="stat-card animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: gradient, boxShadow: `0 8px 20px ${glow}` }}
              >
                <Icon size={20} className="text-white" />
              </div>
              <TrendingUp size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
              {value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Bar chart: registrations per route */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--text-primary))' }}>Registrations by Route</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={routeStats ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-subtle))', borderRadius: '0.75rem', color: 'hsl(var(--text-primary))' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: status breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--text-primary))' }}>Registration Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-subtle))', borderRadius: '0.75rem', color: 'hsl(var(--text-primary))' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
