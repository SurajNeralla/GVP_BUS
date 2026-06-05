import { useAuthStore } from '@/store/authStore'
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

export default function RegistrationPage() {
  const { profile } = useAuthStore()

  const { data: registration } = useQuery({
    queryKey: ['my-registration', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('registrations')
        .select('*, route:routes(*), bus:buses(*)')
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      return data
    },
    enabled: !!profile?.id,
  })

  const statusConfig = {
    pending: { icon: Clock, color: 'hsl(38 92% 60%)', label: 'Pending Admin Review' },
    approved: { icon: CheckCircle2, color: 'hsl(142 71% 60%)', label: 'Approved' },
    rejected: { icon: XCircle, color: 'hsl(0 84% 65%)', label: 'Rejected' },
  }

  const status = registration?.status ?? 'pending'
  const { icon: StatusIcon, color, label } = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
        Bus Registration
      </h1>

      {registration ? (
        <div className="space-y-4">
          {/* Status card */}
          <div
            className="card p-6 text-center"
            style={{ borderColor: color + '33', background: color.replace('hsl(', 'hsl(').replace(')', ' / 0.05)') }}
          >
            <StatusIcon size={40} className="mx-auto mb-3" style={{ color }} />
            <p className="text-lg font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
              {label}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
              Applied {formatDistanceToNow(new Date(registration.created_at), { addSuffix: true })}
            </p>
            {registration.remarks && (
              <p className="mt-3 text-sm p-3 rounded-xl" style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-secondary))' }}>
                {registration.remarks}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="card p-5 space-y-3">
            {[
              { label: 'Route', value: registration.route ? `${(registration.route as any).source} → ${(registration.route as any).destination}` : '—' },
              { label: 'Bus Assigned', value: (registration.bus as any)?.bus_number ?? 'Pending assignment' },
              { label: 'Academic Year', value: registration.academic_year ?? '—' },
              { label: 'Registration ID', value: registration.id.slice(0, 8).toUpperCase() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-glass p-10 text-center">
          <FileText size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>No registration found.</p>
          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            Contact the admin to apply for a bus pass.
          </p>
        </div>
      )}
    </div>
  )
}
