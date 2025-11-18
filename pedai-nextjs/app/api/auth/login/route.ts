import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao fazer login' },
        { status: 401 }
      )
    }

    // Get user profile using service role (bypasses RLS)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', authData.user.id)
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

    // Return success with profile
    return NextResponse.json({
      success: true,
      user: authData.user,
      perfil,
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
