import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// To bypass the browser's block on the Service Role Key without needing a backend server,
// we use a secondary Supabase client with the public Anon Key that does NOT persist sessions.
// This allows admins to create drivers (and students to auto-provision) without logging the current user out.
// IMPORTANT: This requires "Confirm email" to be disabled in Supabase Settings -> Auth.
export const adminCreateUser = async ({ email, password, role }: { email: string; password?: string; role: string }) => {
  const secondaryClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  })

  const { data, error } = await secondaryClient.auth.signUp({
    email,
    password: password || 'DefaultPassword123!',
    options: {
      data: { role }
    }
  })

  if (error) throw error
  if (!data?.user) throw new Error('Failed to create user')
  
  return data.user
}
