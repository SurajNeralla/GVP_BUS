import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BusLocation } from '@/types'

export function useBusLocationRealtime(busId: string | null) {
  const [location, setLocation] = useState<BusLocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!busId) { setLoading(false); return }

    // Initial fetch
    supabase
      .from('bus_locations')
      .select('*')
      .eq('bus_id', busId)
      .single()
      .then(({ data }) => {
        if (data) setLocation(data as BusLocation)
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`bus_location:${busId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => {
          setLocation(payload.new as BusLocation)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [busId])

  return { location, loading }
}

export function useAllBusLocationsRealtime() {
  const [locations, setLocations] = useState<BusLocation[]>([])

  useEffect(() => {
    supabase
      .from('bus_locations')
      .select('*')
      .then(({ data }) => {
        if (data) setLocations(data as BusLocation[])
      })

    const channel = supabase
      .channel('all_bus_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bus_locations' },
        (payload) => {
          setLocations((prev) => {
            const idx = prev.findIndex((l) => l.bus_id === (payload.new as BusLocation).bus_id)
            if (idx === -1) return [...prev, payload.new as BusLocation]
            const updated = [...prev]
            updated[idx] = payload.new as BusLocation
            return updated
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return locations
}
