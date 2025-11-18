import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Fallback to localStorage if cookies don't work (iframe issues in Replit)
          const session = localStorage.getItem('supabase.auth.token')
          if (session) {
            return [
              {
                name: 'sb-jrskruadcwuytvjeqybh-auth-token',
                value: session,
              },
            ]
          }
          return []
        },
        setAll(cookiesToSet) {
          // Store in localStorage as fallback
          cookiesToSet.forEach(({ name, value }) => {
            if (name.includes('auth-token')) {
              localStorage.setItem('supabase.auth.token', value)
            }
          })
        },
      },
    }
  )
}
