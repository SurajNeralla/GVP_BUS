import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { MapPin, ChevronRight } from 'lucide-react'
import type { Stop } from '@/types'

export default function DriverRoutePage() {
  const { profile } = useAuthStore()
  const { data } = useQuery({
    queryKey: ['driver-route', profile?.id],
    queryFn: async () => {
      const { data: driver } = await supabase
        .from('drivers')
        .select('bus:buses(*, route:routes(*))')
        .eq('profile_id', profile!.id)
        .single()
      return driver
    },
    enabled: !!profile?.id,
  })

  const bus = (data?.bus as any)
  const route = bus?.route as any
  const stops: Stop[] = route?.stops ?? []

  if (!route) return (
    <div className="max-w-lg mx-auto px-4 py-10 text-center">
      <MapPin size={36} className="mx-auto mb-3 opacity-30" />
      <p style={{ color: 'hsl(var(--text-muted))' }}>No route assigned.</p>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
        My Route
      </h1>

      <div className="card-glass p-5 mb-4">
        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--text-muted))' }}>Route Name</p>
        <p className="text-lg font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{route.route_name}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="badge badge-approved">{route.source}</span>
          <ChevronRight size={14} style={{ color: 'hsl(var(--text-muted))' }} />
          <span className="badge badge-pending">{route.destination}</span>
        </div>
      </div>

      <div className="card-glass p-5">
        <p className="text-xs font-semibold mb-4" style={{ color: 'hsl(var(--text-muted))' }}>{stops.length} STOPS</p>
        <div className="relative">
          <div className="absolute left-[13px] top-4 bottom-4 w-0.5" style={{ background: 'hsl(var(--border-subtle))' }} />
          <div className="space-y-4">
            {stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-4 relative">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
                  style={{
                    background: i === 0 ? 'hsl(142 71% 45%)' : i === stops.length - 1 ? 'hsl(var(--brand-primary))' : 'hsl(var(--bg-card))',
                    color: i === 0 || i === stops.length - 1 ? 'white' : 'hsl(var(--text-muted))',
                    border: '2px solid hsl(var(--border-subtle))',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{stop.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
