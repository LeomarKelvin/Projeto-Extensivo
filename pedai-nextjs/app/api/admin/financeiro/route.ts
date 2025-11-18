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
    const loja_id = searchParams.get('loja_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('repasses_financeiros')
      .select(`
        *,
        loja:lojas!repasses_financeiros_loja_id_fkey(id, nome_loja, municipio)
      `)
      .order('created_at', { ascending: false })

    if (loja_id) {
      query = query.eq('loja_id', parseInt(loja_id))
    }

    if (status && status !== 'todos') {
      query = query.eq('status', status)
    }

    const { data: repasses, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = {
      receita_total: repasses?.reduce((sum, r) => sum + parseFloat(r.valor_bruto || '0'), 0) || 0,
      comissoes_total: repasses?.reduce((sum, r) => sum + parseFloat(r.comissao_plataforma || '0'), 0) || 0,
      repasses_pendentes: repasses?.filter(r => r.status === 'pendente').length || 0,
      repasses_pagos: repasses?.filter(r => r.status === 'pago').length || 0,
    }

    const { data: lojas } = await supabase
      .from('lojas')
      .select('id, nome_loja')
      .eq('aprovada', true)
      .order('nome_loja')

    return NextResponse.json({ repasses, stats, lojas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
