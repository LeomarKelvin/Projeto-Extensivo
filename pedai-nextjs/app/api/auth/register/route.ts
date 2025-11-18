import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nome, tipo, nome_loja, municipio } = body

    if (!email || !password || !nome || !tipo) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (!municipio) {
      return NextResponse.json(
        { error: 'O município é obrigatório' },
        { status: 400 }
      )
    }

    const municipiosValidos = ['alagoa-nova', 'esperanca', 'lagoa-seca']
    if (!municipiosValidos.includes(municipio)) {
      return NextResponse.json(
        { error: 'Município inválido' },
        { status: 400 }
      )
    }

    if (tipo.toLowerCase() === 'loja' && !nome_loja) {
      return NextResponse.json(
        { error: 'O nome da loja é obrigatório para o tipo de perfil Loja.' },
        { status: 400 }
      )
    }

    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nome_completo: nome,
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Não foi possível criar o usuário na autenticação.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    try {
      // Step 2: Insert profile in 'perfis' table
      const { data: perfilData, error: perfilError } = await supabaseAdmin
        .from('perfis')
        .insert({
          user_id: userId,
          email,
          nome_completo: nome,
          tipo: tipo.toLowerCase(),
          municipio,
        })
        .select()
        .single()

      if (perfilError) throw perfilError

      // Step 3: If user type is 'loja', create the store
      if (perfilData.tipo === 'loja') {
        const { error: lojaError } = await supabaseAdmin
          .from('lojas')
          .insert({
            nome_loja: nome_loja,
            municipio,
            user_id: userId,
            perfil_id: perfilData.id,
          })

        if (lojaError) throw lojaError
      }

      return NextResponse.json(
        {
          message: 'Usuário cadastrado com sucesso!',
          data: { user: authData.user },
        },
        { status: 201 }
      )
    } catch (error: any) {
      console.error('Erro no processo de criação de perfil/loja:', error)
      
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return NextResponse.json(
        {
          error: 'Ocorreu um erro crítico ao registrar seu perfil. O usuário foi removido.',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao processar registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
