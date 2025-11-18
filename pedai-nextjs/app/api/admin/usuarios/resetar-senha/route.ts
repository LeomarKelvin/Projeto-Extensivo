import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!perfil || perfil.tipo !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: resetError } = await serviceSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    const { error: auditError } = await supabase
      .from('auditoria')
      .insert({
        usuario_id: perfil.id,
        usuario_email: perfil.email,
        usuario_nome: perfil.nome_completo,
        acao: 'RESETAR_SENHA_USUARIO',
        entidade: 'perfis',
        dados_novos: { email },
      })

    return NextResponse.json({ 
      message: 'Link de recuperação enviado para o email do usuário' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
