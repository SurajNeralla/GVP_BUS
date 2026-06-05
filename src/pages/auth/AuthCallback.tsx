import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Loader2, Bus } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setProfile, setAssignedBusId } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) { navigate('/login'); return }

      const userId = session.user.id

      // Fetch or create profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // If profile incomplete, redirect to complete it
      if (!profile?.full_name) {
        navigate('/pending?setup=1')
        return
      }

      setProfile(profile)

      if (profile.role === 'admin') { navigate('/admin'); return }
      if (profile.role === 'driver') { navigate('/driver'); return }

      // Student — find assigned bus
      const { data: reg } = await supabase
        .from('registrations')
        .select('bus_id')
        .eq('student_id', userId)
        .eq('status', 'approved')
        .not('bus_id', 'is', null)
        .single()

      if (reg?.bus_id) {
        setAssignedBusId(reg.bus_id)
        navigate(`/bus/${reg.bus_id}`)
      } else {
        setAssignedBusId(null)
        navigate('/pending')
      }
    }

    handleCallback()
  }, [navigate, setProfile, setAssignedBusId])

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
          <Bus size={28} className="text-white" />
        </div>
        <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'hsl(var(--brand-primary))' }} />
        <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Signing you in…</p>
      </div>
    </div>
  )
}
