import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { loja_id, aprovada } = body

    if (!loja_id || aprovada === undefined) {
      return NextResponse.json({ 
        error: 'loja_id e aprovada são obrigatórios' 
      }, { status: 400 })
    }

    const updates: any = {
      aprovada,
      aprovada_em: new Date().toISOString(),
      aprovada_por: perfil.id,
    }

    const { data: loja, error } = await supabase
      .from('lojas')
      .update(updates)
      .eq('id', loja_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
      .from('auditoria')
      .insert({
        usuario_id: perfil.id,
        usuario_email: perfil.email,
        usuario_nome: perfil.nome_completo,
        acao: aprovada ? 'APROVAR_LOJA' : 'REPROVAR_LOJA',
        entidade: 'lojas',
        entidade_id: loja_id,
        dados_novos: updates,
      })

    return NextResponse.json({ 
      loja,
      message: aprovada ? 'Loja aprovada com sucesso' : 'Loja reprovada' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
