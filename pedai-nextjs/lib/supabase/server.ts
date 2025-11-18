import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(accessToken?: string) {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // If an access token is provided (from Authorization header), use it
  if (accessToken) {
    const { data: { user } } = await client.auth.getUser(accessToken)
    if (user) {
      // Set the session manually for this request
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for single request
      })
    }
  }

  return client
}
