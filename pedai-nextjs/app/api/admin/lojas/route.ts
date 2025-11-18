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

    const { searchParams } = new URL(request.url)
    const municipio = searchParams.get('municipio')
    const categoria = searchParams.get('categoria')
    const aprovacao = searchParams.get('aprovacao')

    let query = supabase
      .from('lojas')
      .select(`
        *,
        perfil:perfis!lojas_perfil_id_fkey(nome_completo, email, telefone)
      `)
      .order('created_at', { ascending: false })

    if (municipio && municipio !== 'todos') {
      query = query.eq('municipio', municipio)
    }

    if (categoria && categoria !== 'todas') {
      query = query.eq('categoria', categoria)
    }

    if (aprovacao === 'pendentes') {
      query = query.eq('aprovada', false)
    } else if (aprovacao === 'aprovadas') {
      query = query.eq('aprovada', true)
    }

    const { data: lojas, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = {
      total: lojas?.length || 0,
      aprovadas: lojas?.filter(l => l.aprovada).length || 0,
      pendentes: lojas?.filter(l => !l.aprovada).length || 0,
      abertas: lojas?.filter(l => l.aberta).length || 0,
    }

    return NextResponse.json({ lojas, stats })
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
    const { loja_id, ...updates } = body

    if (!loja_id) {
      return NextResponse.json({ error: 'loja_id é obrigatório' }, { status: 400 })
    }

    const { data: lojaAntes } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', loja_id)
      .single()

    const { data: lojaAtualizada, error } = await supabase
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
        acao: 'ATUALIZAR_LOJA',
        entidade: 'lojas',
        entidade_id: loja_id,
        dados_anteriores: lojaAntes,
        dados_novos: updates,
      })

    return NextResponse.json({ loja: lojaAtualizada })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
