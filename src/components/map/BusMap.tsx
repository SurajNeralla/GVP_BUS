import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Stop, BusLocation } from '@/types'

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom bus icon
const busIcon = L.divIcon({
  html: `<div style="
    width:40px;height:40px;border-radius:50% 50% 50% 0;
    background:linear-gradient(135deg,#3b82f6,#8b5cf6);
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 20px rgba(59,130,246,0.5);
    border:3px solid white;
  ">
    <span style="transform:rotate(45deg);font-size:16px;">🚌</span>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -42],
})

const stopIcon = L.divIcon({
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:hsl(38,92%,50%);border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 })
    }
  }, [map, positions])
  return null
}

function LiveMarker({ location, busNumber }: { location: BusLocation; busNumber: string }) {
  const map = useMap()
  useEffect(() => {
    if (location.latitude && location.longitude) {
      map.panTo([location.latitude, location.longitude], { animate: true, duration: 1 })
    }
  }, [location.latitude, location.longitude, map])

  if (!location.latitude || !location.longitude) return null
  return (
    <Marker position={[location.latitude, location.longitude]} icon={busIcon}>
      <Popup>
        <div style={{ color: '#0f172a', minWidth: 140 }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>🚌 Bus {busNumber}</p>
          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
            Status: <strong>{location.trip_status.replace('_', ' ')}</strong>
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
            Updated: {new Date(location.updated_at).toLocaleTimeString()}
          </p>
        </div>
      </Popup>
    </Marker>
  )
}

interface BusMapProps {
  location: BusLocation | null
  stops: Stop[]
  busNumber: string
  osrmRoute?: [number, number][]
  height?: string
  className?: string
}

export default function BusMap({ location, stops, busNumber, osrmRoute, height = '400px', className = '' }: BusMapProps) {
  const defaultCenter: [number, number] = [17.7384, 83.2167] // Visakhapatnam

  const allPositions: [number, number][] = [
    ...stops.map((s) => [s.lat, s.lng] as [number, number]),
    ...(location?.latitude && location?.longitude ? [[location.latitude, location.longitude] as [number, number]] : []),
  ]

  return (
    <div style={{ height, borderRadius: '1rem', overflow: 'hidden', position: 'relative' }} className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="Google Maps"
        />

        {/* OSRM route polyline (road-following) */}
        {osrmRoute && osrmRoute.length > 0 && (
          <Polyline
            positions={osrmRoute}
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: undefined }}
          />
        )}

        {/* Fallback straight lines between stops */}
        {!osrmRoute && stops.length > 1 && (
          <Polyline
            positions={stops.map((s) => [s.lat, s.lng])}
            pathOptions={{ color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '8,6' }}
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, i) => (
          <Marker key={i} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Popup>
              <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>📍 {stop.name}</p>
              {i === 0 && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#22c55e' }}>Starting Point</p>}
              {i === stops.length - 1 && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#f59e0b' }}>Destination</p>}
            </Popup>
          </Marker>
        ))}

        {/* Live bus marker */}
        {location && <LiveMarker location={location} busNumber={busNumber} />}

        {/* Fit map to all markers */}
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}
      </MapContainer>
    </div>
  )
}
