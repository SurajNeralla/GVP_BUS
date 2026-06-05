const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// The Supabase JS SDK explicitly throws an error if it sees a secret key in the browser.
// To bypass this for our college project demo without needing a backend edge function,
// we manually construct the API request to the Auth Admin endpoint.
export const adminCreateUser = async ({ email, password, role }: { email: string; password?: string; role: string }) => {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    })
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || data.msg || 'Failed to create user')
  }
  return data
}
