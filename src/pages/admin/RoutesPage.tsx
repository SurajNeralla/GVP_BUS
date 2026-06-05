import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, MapPin, X, Loader2, ChevronRight } from 'lucide-react'
import type { Route, Stop } from '@/types'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const stopIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2563eb;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 })
    }
  }, [map, positions])
  return null
}

const emptyRoute = { route_name: '', source: '', destination: '', stops: [] as Stop[], fare: 0 }

function MapEvents({ stops, onChange }: { stops: Stop[], onChange: (s: Stop[]) => void }) {
  useMapEvents({
    click(e) {
      onChange([...stops, { name: `Stop ${stops.length + 1}`, lat: e.latlng.lat, lng: e.latlng.lng }])
    }
  })
  return null
}

function InteractiveMapEditor({ stops, onChange }: { stops: Stop[]; onChange: (s: Stop[]) => void }) {
  const remove = (i: number) => onChange(stops.filter((_, j) => j !== i))
  const updateName = (i: number, name: string) =>
    onChange(stops.map((s, j) => j === i ? { ...s, name } : s))
  const updatePosition = (i: number, lat: number, lng: number) =>
    onChange(stops.map((s, j) => j === i ? { ...s, lat, lng } : s))

  const center: [number, number] = stops.length > 0 ? [stops[0].lat, stops[0].lng] : [17.8205, 83.3444] // Default GVP area

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      {/* Map Section */}
      <div className="h-[400px] rounded-xl overflow-hidden border relative" style={{ borderColor: 'hsl(var(--border-subtle))' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
          <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />
          <MapEvents stops={stops} onChange={onChange} />
          
          {stops.map((s, i) => (
            <Marker 
              key={i} 
              position={[s.lat, s.lng]} 
              draggable 
              icon={stopIcon}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target
                  const position = marker.getLatLng()
                  updatePosition(i, position.lat, position.lng)
                }
              }}
            >
              <Popup>{s.name}</Popup>
            </Marker>
          ))}
          
          {stops.length > 1 && (
            <Polyline 
              positions={stops.map(s => [s.lat, s.lng])} 
              pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }} 
            />
          )}

          {/* Auto zoom to fit all stops when edited */}
          <FitBounds positions={stops.map(s => [s.lat, s.lng])} />
        </MapContainer>
        <div className="absolute top-2 right-2 z-20 p-2 rounded-lg text-xs shadow-md backdrop-blur-md" 
             style={{ background: 'hsl(var(--bg-card) / 0.8)', color: 'hsl(var(--text-primary))', border: '1px solid hsl(var(--border-subtle))' }}>
          🖱️ Click map to add stop<br/>
          🖐️ Drag markers to move
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <label className="block text-xs font-semibold mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>
          Stops List ({stops.length})
        </label>
        
        {stops.map((s, i) => (
          <div key={i} className="flex gap-2 items-center p-3 rounded-xl border animate-slide-up" style={{ background: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-subtle))' }}>
            <div className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0"
              style={{ background: 'var(--gradient-primary)', color: 'white' }}>{i + 1}</div>
            
            <div className="flex-1">
              <input 
                className="input py-1.5 text-xs w-full mb-1" 
                placeholder="E.g. College Main Gate" 
                value={s.name}
                onChange={(e) => updateName(i, e.target.value)} 
              />
              <div className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
                Lat: {s.lat.toFixed(5)} • Lng: {s.lng.toFixed(5)}
              </div>
            </div>

            <button type="button" onClick={() => remove(i)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-all">
              <X size={15} style={{ color: 'hsl(var(--danger))' }} />
            </button>
          </div>
        ))}

        {stops.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: 'hsl(var(--border-subtle))' }}>
            <MapPin size={28} className="mx-auto mb-3 opacity-50" style={{ color: 'hsl(var(--brand-primary))' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>No stops added</p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Click anywhere on the map to add your first stop</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RoutesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState(emptyRoute)

  const { data: routes = [] } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => {
      const { data } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
      return (data ?? []) as Route[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await supabase.from('routes').update(form).eq('id', editing.id)
      } else {
        await supabase.from('routes').insert(form)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] })
      setShowForm(false); setEditing(null); setForm(emptyRoute)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('routes').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-routes'] }),
  })

  const openEdit = (r: Route) => {
    setEditing(r)
    setForm({ route_name: r.route_name, source: r.source, destination: r.destination, stops: r.stops, fare: r.fare })
    setShowForm(true)
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Routes</h1>
        <button onClick={() => { setEditing(null); setForm(emptyRoute); setShowForm(true) }} className="btn-primary px-4 py-2 text-sm gap-2">
          <Plus size={16} /> New Route
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-glass p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{editing ? 'Edit Route' : 'New Route'}</h2>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: 'hsl(var(--text-muted))' }} /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Route Name', key: 'route_name', placeholder: 'Route 1 - City Center' },
              { label: 'Source', key: 'source', placeholder: 'College Gate' },
              { label: 'Destination', key: 'destination', placeholder: 'Bus Stand' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>{label}</label>
                <input
                  type="text" className="input" placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <InteractiveMapEditor stops={form.stops} onChange={(stops) => setForm((f) => ({ ...f, stops }))} />
          <div className="flex gap-3 mt-5">
            <button onClick={() => saveMutation.mutate()} className="btn-primary px-6 py-2.5 text-sm gap-2" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : editing ? 'Save Changes' : 'Create Route'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Routes list */}
      <div className="grid md:grid-cols-2 gap-4">
        {routes.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{r.route_name}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                  <span>{r.source}</span>
                  <ChevronRight size={12} />
                  <span>{r.destination}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all">
                  <Pencil size={14} style={{ color: 'hsl(var(--brand-primary))' }} />
                </button>
                <button onClick={() => deleteMutation.mutate(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-all">
                  <Trash2 size={14} style={{ color: 'hsl(0 84% 60%)' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="badge badge-approved"><MapPin size={10} />{r.stops.length} stops</span>
            </div>
          </div>
        ))}
        {routes.length === 0 && (
          <div className="col-span-2 py-12 text-center" style={{ color: 'hsl(var(--text-muted))' }}>No routes yet. Create one!</div>
        )}
      </div>
    </div>
  )
}
