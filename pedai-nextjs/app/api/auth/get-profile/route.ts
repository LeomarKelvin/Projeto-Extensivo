import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header (for localStorage-based auth)
    const authHeader = request.headers.get('Authorization')
    let user = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Verify token with Supabase
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (!tokenError && tokenUser) {
        user = tokenUser
      }
    }

    // Fallback to cookie-based auth
    if (!user) {
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: userError } = await supabase.auth.getUser()
      
      if (!userError && cookieUser) {
        user = cookieUser
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user profile using service role (bypasses RLS)
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (perfilError) {
      console.error('Error fetching profile:', perfilError)
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado. Entre em contato com o suporte.' },
        { status: 404 }
      )
    }

    // Check if user is blocked
    if (perfil.bloqueado) {
      return NextResponse.json(
        { 
          error: `Usuário bloqueado: ${perfil.bloqueado_motivo || 'Entre em contato com o suporte'}` 
        },
        { status: 403 }
      )
    }

    // Return profile
    return NextResponse.json({
      success: true,
      perfil,
    })

  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}
