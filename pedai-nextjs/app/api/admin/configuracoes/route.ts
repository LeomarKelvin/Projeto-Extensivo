import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('user_id', user.id)
      .single()

    if (!perfil || perfil.tipo !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { data: configuracoes, error } = await supabase
      .from('configuracoes_plataforma')
      .select('*')
      .order('chave')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ configuracoes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { chave, valor, municipio } = body

    if (!chave || !valor) {
      return NextResponse.json({ 
        error: 'chave e valor são obrigatórios' 
      }, { status: 400 })
    }

    let query = supabase
      .from('configuracoes_plataforma')
      .update({ valor })
      .eq('chave', chave)

    if (municipio) {
      query = query.eq('municipio', municipio)
    } else {
      query = query.is('municipio', null)
    }

    const { data: config, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
      .from('auditoria')
      .insert({
        usuario_id: perfil.id,
        usuario_email: perfil.email,
        usuario_nome: perfil.nome_completo,
        acao: 'ATUALIZAR_CONFIGURACAO',
        entidade: 'configuracoes_plataforma',
        entidade_id: config.id,
        dados_novos: { chave, valor, municipio },
      })

    return NextResponse.json({ configuracao: config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
