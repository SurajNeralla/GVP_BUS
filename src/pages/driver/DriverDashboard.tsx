import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import BusMap from '@/components/map/BusMap'
import type { TripStatus, Stop } from '@/types'
import { Navigation, MapPin, Users, Play, Square, Loader2, AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react'

const TRIP_STATUSES: { value: TripStatus; label: string; icon: React.FC<any>; color: string }[] = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'hsl(var(--text-muted))' },
  { value: 'running', label: 'Running', icon: Navigation, color: 'hsl(142 71% 60%)' },
  { value: 'delayed', label: 'Delayed', icon: AlertTriangle, color: 'hsl(38 92% 60%)' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'hsl(199 89% 60%)' },
]

export default function DriverDashboard() {
  const { profile } = useAuthStore()
  const [tripStatus, setTripStatus] = useState<TripStatus>('not_started')

  const { data: driverData } = useQuery({
    queryKey: ['driver-info', profile?.id],
    queryFn: async () => {
      const { data: driver } = await supabase
        .from('drivers')
        .select('*, bus:buses(*, route:routes(*))')
        .eq('profile_id', profile!.id)
        .single()

      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('bus_id', driver?.bus_id ?? '')
        .eq('status', 'approved')

      return { driver, passengerCount: count ?? 0 }
    },
    enabled: !!profile?.id,
  })

  const driver = driverData?.driver
  const bus = driver?.bus as any
  const route = bus?.route as any
  const stops: Stop[] = route?.stops ?? []
  const busId = driver?.bus_id ?? null

  const { latitude, longitude, sharing, error, startSharing, stopSharing } = useGeolocation(busId)

  const location = latitude && longitude
    ? { id: '', bus_id: busId!, latitude, longitude, trip_status: tripStatus, updated_at: new Date().toISOString() }
    : null

  const handleStart = async () => {
    await startSharing(tripStatus === 'not_started' ? 'running' : tripStatus)
    if (tripStatus === 'not_started') setTripStatus('running')
  }

  const handleStop = async () => {
    await stopSharing('completed')
    setTripStatus('completed')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
          Driver Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
          Hello, {profile?.full_name ?? 'Driver'} 👋
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bus Number', value: bus?.bus_number ?? '—', icon: Navigation, color: 'hsl(var(--brand-primary))' },
          { label: 'Passengers', value: driverData?.passengerCount ?? 0, icon: Users, color: 'hsl(262 83% 70%)' },
          { label: 'GPS', value: sharing ? 'Sharing' : 'Off', icon: MapPin, color: sharing ? 'hsl(142 71% 60%)' : 'hsl(var(--text-muted))' },
          { label: 'Status', value: TRIP_STATUSES.find((s) => s.value === tripStatus)?.label ?? '—', icon: Clock, color: 'hsl(38 92% 60%)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon size={18} style={{ color }} className="mb-2" />
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{label}</p>
            <p className="text-base font-bold mt-0.5" style={{ color: 'hsl(var(--text-primary))' }}>{String(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Map */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Your Location</h2>
            {sharing && <div className="live-indicator"><span className="live-dot" /> Sharing Live</div>}
          </div>
          <BusMap location={location} stops={stops} busNumber={bus?.bus_number ?? ''} height="240px" />
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Trip controls */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--text-primary))' }}>Trip Control</h2>

            {/* Status selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {TRIP_STATUSES.filter((s) => s.value !== 'not_started').map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setTripStatus(value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    borderColor: tripStatus === value ? color : 'hsl(var(--border-subtle))',
                    background: tripStatus === value ? color.replace('hsl(', 'hsl(').replace(')', ' / 0.12)') : 'transparent',
                    color: tripStatus === value ? color : 'hsl(var(--text-secondary))',
                  }}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Start / Stop */}
            {!sharing ? (
              <button
                onClick={handleStart}
                className="btn-primary w-full py-3 gap-2"
                disabled={!busId}
              >
                <Play size={16} /> Start Trip & Share Location
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'var(--gradient-danger)', color: 'white' }}
              >
                <Square size={16} /> End Trip
              </button>
            )}
          </div>

          {/* Route info */}
          {route && (
            <div className="card p-4">
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'hsl(var(--text-primary))' }}>Today's Route</h2>
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className="badge badge-approved">{route.source}</span>
                <span style={{ color: 'hsl(var(--text-muted))' }}>→</span>
                <span className="badge badge-pending">{route.destination}</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {stops.map((stop: Stop, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold shrink-0"
                      style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-muted))' }}>
                      {i + 1}
                    </div>
                    <span className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>{stop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
