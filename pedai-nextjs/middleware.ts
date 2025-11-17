import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getTenantBySlug } from '@/lib/tenantConfig'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Extract potential tenant slug from path
  const pathParts = pathname.split('/').filter(Boolean)
  const potentialSlug = pathParts[0]
  
  // Check if this is a tenant route
  const tenant = getTenantBySlug(potentialSlug)
  
  // Update Supabase session
  const { supabaseResponse } = await updateSession(request)
  
  // Add tenant info to response headers if tenant exists
  if (tenant) {
    supabaseResponse.headers.set('x-tenant-slug', tenant.slug)
    supabaseResponse.headers.set('x-tenant-name', tenant.name)
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
