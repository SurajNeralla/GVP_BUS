import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useBusLocationRealtime } from '@/hooks/useRealtime'
import { useNotifications } from '@/hooks/useNotifications'
import BusMap from '@/components/map/BusMap'
import type { Bus, Route, Driver, Profile, Stop } from '@/types'
import {
  Bus as BusIcon, MapPin, Users, Clock, Navigation, ChevronRight,
  Wifi, WifiOff, AlertTriangle, CheckCircle2, Circle, Bell, Phone, User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

async function fetchOsrmRoute(stops: Stop[]): Promise<[number, number][]> {
  if (stops.length < 2) return []
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';')
  try {
    const res = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson`)
    const data = await res.json()
    if (data.code === 'Ok' && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng])
    }
  } catch {}
  return []
}

function TripStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: React.FC<any>; label: string; cls: string }> = {
    not_started: { icon: Circle, label: 'Not Started', cls: 'badge-not_started' },
    running: { icon: Navigation, label: 'Running', cls: 'badge-running' },
    delayed: { icon: AlertTriangle, label: 'Delayed', cls: 'badge-delayed' },
    completed: { icon: CheckCircle2, label: 'Completed', cls: 'badge-completed' },
  }
  const { icon: Icon, label, cls } = cfg[status] ?? cfg.not_started
  return (
    <span className={`badge ${cls}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export default function BusDashboard() {
  const { busId } = useParams<{ busId: string }>()
  const { profile } = useAuthStore()
  const { location, loading: locLoading } = useBusLocationRealtime(busId ?? null)
  const { unreadCount } = useNotifications()
  const [osrmRoute, setOsrmRoute] = useState<[number, number][]>([])

  // Fetch bus + route + driver
  const { data: busData } = useQuery({
    queryKey: ['bus-dashboard', busId],
    queryFn: async () => {
      const { data: bus } = await supabase
        .from('buses')
        .select('*, route:routes(*)')
        .eq('id', busId!)
        .single()

      const { data: driver } = await supabase
        .from('drivers')
        .select('*, profile:profiles(*)')
        .eq('bus_id', busId!)
        .single()

      const { count: passengerCount } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('bus_id', busId!)
        .eq('status', 'approved')

      return { bus, driver, passengerCount: passengerCount ?? 0 }
    },
    enabled: !!busId,
  })

  const bus = busData?.bus as (Bus & { route: Route }) | undefined
  const driver = busData?.driver as (Driver & { profile: Profile }) | undefined
  const route = bus?.route
  const stops: Stop[] = (route?.stops as Stop[]) ?? []

  // Fetch OSRM route
  useEffect(() => {
    if (stops.length >= 2) {
      fetchOsrmRoute(stops).then(setOsrmRoute)
    }
  }, [stops])

  const isOnline = !!(location?.latitude && location?.longitude)
  const lastUpdate = location?.updated_at
    ? formatDistanceToNow(new Date(location.updated_at), { addSuffix: true })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
          </p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif', color: 'hsl(var(--text-primary))' }}>
            {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
            {profile?.roll_number} · {profile?.department}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="badge badge-pending shrink-0">
            <Bell size={12} />
            {unreadCount} new
          </div>
        )}
      </div>

      {/* Bus status hero card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'var(--gradient-primary)', boxShadow: '0 20px 60px -15px rgba(59,130,246,0.5)' }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BusIcon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Your Bus</p>
                <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk' }}>
                  {bus?.bus_number ?? '...'}
                </p>
              </div>
            </div>
            {location && <TripStatusBadge status={location.trip_status} />}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-xs mb-1">Capacity</p>
              <p className="text-white font-bold">{bus?.capacity ?? '—'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-xs mb-1">Passengers</p>
              <p className="text-white font-bold">{busData?.passengerCount ?? '—'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-xs mb-1">GPS</p>
              <p className="text-white font-bold flex items-center justify-center gap-1">
                {isOnline ? <><span className="live-dot" />Live</> : <WifiOff size={14} />}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-4 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Map + Route grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Live Map */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Live Location</h2>
            <div className="live-indicator">
              <span className="live-dot" />
              {isOnline ? 'Live' : 'Offline'}
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
              <Clock size={11} className="inline mr-1" />
              Updated {lastUpdate}
            </p>
          )}
          <BusMap
            location={location}
            stops={stops}
            busNumber={bus?.bus_number ?? ''}
            osrmRoute={osrmRoute}
            height="260px"
          />
        </div>

        {/* Route info */}
        <div className="space-y-4">
          {/* Route card */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} style={{ color: 'hsl(var(--brand-primary))' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Route Details</h2>
            </div>
            {route ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'hsl(142 71% 45% / 0.15)', color: 'hsl(142 71% 60%)' }}>
                    {route.source}
                  </div>
                  <ChevronRight size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'hsl(var(--brand-primary) / 0.15)', color: 'hsl(var(--brand-primary))' }}>
                    {route.destination}
                  </div>
                </div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--text-muted))' }}>
                  {stops.length} Stops
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0"
                        style={{
                          background: i === 0 ? 'hsl(142 71% 45% / 0.2)' : i === stops.length - 1 ? 'hsl(var(--brand-primary) / 0.2)' : 'hsl(var(--border-subtle))',
                          color: i === 0 ? 'hsl(142 71% 60%)' : i === stops.length - 1 ? 'hsl(var(--brand-primary))' : 'hsl(var(--text-muted))',
                        }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>{stop.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>No route assigned yet.</p>
            )}
          </div>

          {/* Driver card */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} style={{ color: 'hsl(var(--brand-secondary))' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>Your Driver</h2>
            </div>
            {driver?.profile ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                  {driver.profile.full_name?.charAt(0) ?? 'D'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{driver.profile.full_name}</p>
                  {driver.profile.phone && (
                    <a href={`tel:${driver.profile.phone}`} className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--brand-primary))' }}>
                      <Phone size={11} />{driver.profile.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Driver info not available.</p>
            )}
          </div>

          {/* Passengers card */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(262 83% 58% / 0.15)' }}>
              <Users size={20} style={{ color: 'hsl(262 83% 70%)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Registered Passengers</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{busData?.passengerCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
