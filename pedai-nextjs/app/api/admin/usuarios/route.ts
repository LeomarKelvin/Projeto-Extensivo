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
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const busca = searchParams.get('busca')

    let query = supabase
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false })

    if (tipo && tipo !== 'todos') {
      query = query.eq('tipo', tipo)
    }

    if (status === 'bloqueados') {
      query = query.eq('bloqueado', true)
    } else if (status === 'ativos') {
      query = query.eq('bloqueado', false)
    }

    if (busca) {
      query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%`)
    }

    const { data: usuarios, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = {
      total: usuarios?.length || 0,
      ativos: usuarios?.filter(u => !u.bloqueado).length || 0,
      bloqueados: usuarios?.filter(u => u.bloqueado).length || 0,
      clientes: usuarios?.filter(u => u.tipo === 'cliente').length || 0,
      lojas: usuarios?.filter(u => u.tipo === 'loja').length || 0,
      entregadores: usuarios?.filter(u => u.tipo === 'entregador').length || 0,
    }

    return NextResponse.json({ usuarios, stats })
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
    const { usuario_id, bloqueado, bloqueado_motivo } = body

    if (!usuario_id) {
      return NextResponse.json({ error: 'usuario_id é obrigatório' }, { status: 400 })
    }

    const updates: any = { bloqueado }
    
    if (bloqueado) {
      updates.bloqueado_motivo = bloqueado_motivo || 'Sem motivo informado'
      updates.bloqueado_em = new Date().toISOString()
    } else {
      updates.bloqueado_motivo = null
      updates.bloqueado_em = null
    }

    const { data: updated, error } = await supabase
      .from('perfis')
      .update(updates)
      .eq('id', usuario_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: auditError } = await supabase
      .from('auditoria')
      .insert({
        usuario_id: perfil.id,
        usuario_email: perfil.email,
        usuario_nome: perfil.nome_completo,
        acao: bloqueado ? 'BLOQUEAR_USUARIO' : 'DESBLOQUEAR_USUARIO',
        entidade: 'perfis',
        entidade_id: usuario_id,
        dados_novos: updates,
      })

    return NextResponse.json({ usuario: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
