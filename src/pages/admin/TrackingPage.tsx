import { useAllBusLocationsRealtime } from '@/hooks/useRealtime'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDistanceToNow } from 'date-fns'
import type { Bus, BusLocation, Route, Stop } from '@/types'
import { useState, useEffect } from 'react'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const tripColors: Record<string, string> = { running: '#22c55e', delayed: '#f59e0b', completed: '#3b82f6', not_started: '#6b7280' }

function makeBusIcon(status: string, busNumber: string) {
  const color = tripColors[status] ?? '#6b7280'
  return L.divIcon({
    html: `<div style="
      background:${color};border:3px solid white;
      width:36px;height:36px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:white;
      box-shadow:0 4px 15px ${color}88;
    ">${busNumber.slice(-4)}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  })
}

const stopIcon = L.divIcon({
  html: `<div style="
    width:10px;height:10px;border-radius:50%;
    background:hsl(38,92%,50%);border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.3);
  "></div>`,
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

function LiveBusRoute({ bus, location, route }: { bus: Bus; location: BusLocation; route?: Route }) {
  const [osrmRoute, setOsrmRoute] = useState<[number, number][]>([])

  useEffect(() => {
    async function fetchRoute() {
      if (!route || route.stops.length < 2) return
      try {
        const coords = route.stops.map(s => `${s.lng},${s.lat}`).join(';')
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
        const data = await res.json()
        if (data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates
          setOsrmRoute(coordinates.map((c: any) => [c[1], c[0]]))
        }
      } catch (err) {
        console.error('Failed to fetch OSRM route for tracking', err)
      }
    }
    fetchRoute()
  }, [route])

  return (
    <>
      {/* Route Line & Stops */}
      {route && (
        <>
          {osrmRoute.length > 0 ? (
            <Polyline 
              positions={osrmRoute} 
              pathOptions={{ color: tripColors[location.trip_status] ?? '#3b82f6', weight: 4, opacity: 0.5 }} 
            />
          ) : route.stops.length > 1 && (
            <Polyline 
              positions={route.stops.map(s => [s.lat, s.lng])} 
              pathOptions={{ color: tripColors[location.trip_status] ?? '#3b82f6', weight: 3, opacity: 0.5, dashArray: '6,6' }} 
            />
          )}
          
          {route.stops.map((stop, i) => (
            <Marker key={i} position={[stop.lat, stop.lng]} icon={stopIcon}>
              <Popup>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>📍 {stop.name}</p>
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {/* Bus Marker */}
      <Marker
        position={[location.latitude!, location.longitude!]}
        icon={makeBusIcon(location.trip_status, bus.bus_number)}
      >
        <Popup>
          <div style={{ color: '#0f172a', minWidth: 160 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🚌 {bus.bus_number}</p>
            <p style={{ fontSize: 12, margin: '2px 0' }}>Status: <strong style={{ color: tripColors[location.trip_status] }}>{location.trip_status.replace('_', ' ')}</strong></p>
            {route && <p style={{ fontSize: 12, margin: '2px 0' }}>Route: <strong>{route.route_name}</strong></p>}
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
              {formatDistanceToNow(new Date(location.updated_at), { addSuffix: true })}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  )
}

export default function TrackingPage() {
  const locations = useAllBusLocationsRealtime()

  const { data: buses = [] } = useQuery({
    queryKey: ['all-buses'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('*')
      return (data ?? []) as Bus[]
    },
  })

  const { data: routes = [] } = useQuery({
    queryKey: ['all-routes'],
    queryFn: async () => {
      const { data } = await supabase.from('routes').select('*')
      return (data ?? []) as Route[]
    },
  })

  const activeLocations = locations.filter((l) => l.latitude && l.longitude && l.trip_status !== 'not_started')

  const getBus = (busId: string) => buses.find((b) => b.id === busId)

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Live Tracking</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
          {activeLocations.length} bus{activeLocations.length !== 1 ? 'es' : ''} active right now
        </p>
      </div>

      {/* Status chips */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(tripColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: color + '15', color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {status.replace('_', ' ')}
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ height: '500px', borderRadius: '1.25rem', overflow: 'hidden' }}>
        <MapContainer
          center={[17.7384, 83.2167]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {activeLocations.map((loc) => {
            const bus = getBus(loc.bus_id)
            if (!bus) return null
            const route = routes.find(r => r.id === bus.route_id)
            return <LiveBusRoute key={loc.bus_id} bus={bus} location={loc} route={route} />
          })}
        </MapContainer>
      </div>

      {/* Bus status table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Bus</th><th>Status</th><th>Coordinates</th><th>Last Update</th></tr>
            </thead>
            <tbody>
              {locations.map((loc) => {
                const bus = getBus(loc.bus_id)
                return (
                  <tr key={loc.bus_id}>
                    <td className="font-mono font-semibold">{bus?.bus_number ?? loc.bus_id.slice(0, 8)}</td>
                    <td>
                      <span className={`badge badge-${loc.trip_status}`}>{loc.trip_status.replace('_', ' ')}</span>
                    </td>
                    <td className="text-xs font-mono" style={{ color: 'hsl(var(--text-muted))' }}>
                      {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
                    </td>
                    <td className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                      {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                    </td>
                  </tr>
                )
              })}
              {locations.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'hsl(var(--text-muted))' }}>No active buses.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
