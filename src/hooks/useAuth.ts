import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types'

export function useAuth() {
  const {
    user, session, profile, loading, assignedBusId,
    setUser, setSession, setProfile, setLoading, setAssignedBusId, clear,
  } = useAuthStore()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
    return data
  }, [setProfile])

  const fetchAssignedBus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('registrations')
      .select('bus_id')
      .eq('student_id', userId)
      .eq('status', 'approved')
      .not('bus_id', 'is', null)
      .single()
    const busId = data?.bus_id ?? null
    setAssignedBusId(busId)
    return busId
  }, [setAssignedBusId])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const prof = await fetchProfile(session.user.id)
        if (prof?.role === 'student') {
          await fetchAssignedBus(session.user.id)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const prof = await fetchProfile(session.user.id)
          if (prof?.role === 'student') {
            await fetchAssignedBus(session.user.id)
          }
        } else {
          clear()
        }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchProfile, fetchAssignedBus, setSession, setUser, setLoading, clear])

  const signInWithMagicLink = async (email: string) => {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithPassword = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clear()
  }

  return {
    user, session, profile, loading, assignedBusId,
    signInWithMagicLink, signInWithPassword, signOut,
    fetchProfile, fetchAssignedBus,
  }
}
