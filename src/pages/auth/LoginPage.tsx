import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Bus, Mail, ArrowRight, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const COLLEGE_DOMAIN = 'gvpcdpgc.edu.in'
const EMAIL_REGEX = /^[A-Z0-9][A-Z0-9._-]*@gvpcdpgc\.edu\.in$/i

type Mode = 'student' | 'staff'
type Step = 'email' | 'staff_login'

export default function LoginPage() {
  const { signInWithPassword } = useAuth()
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin')
      else if (profile.role === 'driver') navigate('/driver')
      else navigate('/pending') // student route handles redirecting to their bus dashboard
    }
  }, [profile, navigate])

  const [mode, setMode] = useState<Mode>('student')
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const validateStudentEmail = (e: string) => {
    if (!EMAIL_REGEX.test(e)) return 'Email must be in format ROLLNUMBER@gvpcdpgc.edu.in'
    return ''
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = validateStudentEmail(email)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      const emailLower = email.toLowerCase().trim()
      const defaultPassword = 'Student@Password123!'
      
      let { data, error: authError } = await signInWithPassword(emailLower, defaultPassword)
      
      // If user doesn't exist yet, auto-create them using the admin client
      if (authError && authError.message.toLowerCase().includes('invalid login credentials')) {
        const { supabaseAdmin } = await import('@/lib/supabase-admin')
        
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: emailLower,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: { role: 'student' }
        })
        
        if (createErr) throw createErr
        
        // Retry sign in
        const retry = await signInWithPassword(emailLower, defaultPassword)
        data = retry.data
        authError = retry.error
      }
      
      if (authError) throw authError
      if (!data?.user) throw new Error('Login failed')
      
      // The useEffect will handle the redirect automatically once profile loads
    } catch (err: any) {
      setError(err.message ?? 'Failed to sign in. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true)
    try {
      const { data, error: authError } = await signInWithPassword(email, password)
      if (authError) throw authError
      
      if (!data.user) throw new Error('No user returned')
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const role = prof?.role || data.user?.user_metadata?.role
      
      if (role === 'admin') navigate('/admin')
      else if (role === 'driver') navigate('/driver')
      else navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
            <Bus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif', color: 'hsl(var(--text-primary))' }}>
            GVPCDPGC Bus Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Smart Bus Registration & Live Tracking</p>
        </div>

        {/* Mode tabs */}
        <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'hsl(var(--bg-card))' }}>
          {[
            { key: 'student', label: 'Student', icon: Mail },
            { key: 'staff', label: 'Admin / Driver', icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setMode(key as Mode); setStep(key === 'student' ? 'email' : 'staff_login'); setError('') }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === key ? 'var(--gradient-primary)' : 'transparent',
                color: mode === key ? 'white' : 'hsl(var(--text-secondary))',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="card-glass p-7">
          {/* Student — Email step */}
          {mode === 'student' && step === 'email' && (
            <>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>Student Sign In</h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
                Enter your college email to access your bus tracking dashboard.
              </p>
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                    College Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="23BCA001@gvpcdpgc.edu.in"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    autoComplete="email"
                    required
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    Format: ROLLNUMBER@{COLLEGE_DOMAIN}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 70%)', border: '1px solid hsl(0 84% 60% / 0.2)' }}>
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Sign In</>}
                </button>
              </form>

              <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'hsl(var(--brand-primary) / 0.08)', color: 'hsl(var(--text-secondary))' }}>
                ✨ We will automatically log you in. No password required!
              </div>
            </>
          )}

          {/* Admin / Driver login */}
          {mode === 'staff' && (
            <>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>Staff Sign In</h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
                For Admins and Drivers only.
              </p>
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="admin@gvpcdpgc.edu.in"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--text-secondary))' }}>Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 70%)', border: '1px solid hsl(0 84% 60% / 0.2)' }}>
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Sign In</>}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'hsl(var(--text-muted))' }}>
          <Link to="/" className="hover:underline" style={{ color: 'hsl(var(--text-secondary))' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
