import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { TripStatus } from '@/types'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  sharing: boolean
}

export function useGeolocation(busId: string | null) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    sharing: false,
  })
  const watchIdRef = useRef<number | null>(null)
  const busIdRef = useRef(busId)
  busIdRef.current = busId

  const startSharing = useCallback(async (tripStatus: TripStatus = 'running') => {
    if (!busIdRef.current) return
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }))
      return
    }

    // Ensure bus_locations row exists
    await supabase.from('bus_locations').upsert({
      bus_id: busIdRef.current,
      latitude: null,
      longitude: null,
      trip_status: tripStatus,
    }, { onConflict: 'bus_id' })

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setState((s) => ({ ...s, latitude, longitude, error: null, sharing: true }))
        await supabase.from('bus_locations').upsert(
          {
            bus_id: busIdRef.current!,
            latitude,
            longitude,
            trip_status: tripStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'bus_id' }
        )
      },
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    setState((s) => ({ ...s, sharing: true }))
  }, [])

  const stopSharing = useCallback(async (completedStatus: TripStatus = 'completed') => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (busIdRef.current) {
      await supabase.from('bus_locations').upsert(
        { bus_id: busIdRef.current, trip_status: completedStatus, updated_at: new Date().toISOString() },
        { onConflict: 'bus_id' }
      )
    }
    setState((s) => ({ ...s, sharing: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  return { ...state, startSharing, stopSharing }
}
