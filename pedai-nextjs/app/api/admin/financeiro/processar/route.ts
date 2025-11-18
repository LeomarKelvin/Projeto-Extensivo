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
    const { repasse_id, status, observacoes } = body

    if (!repasse_id || !status) {
      return NextResponse.json({ 
        error: 'repasse_id e status são obrigatórios' 
      }, { status: 400 })
    }

    const updates: any = {
      status,
      processado_por: perfil.id,
      observacoes,
    }

    if (status === 'pago') {
      updates.data_pagamento = new Date().toISOString()
    }

    const { data: repasse, error } = await supabase
      .from('repasses_financeiros')
      .update(updates)
      .eq('id', repasse_id)
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
        acao: 'PROCESSAR_REPASSE',
        entidade: 'repasses_financeiros',
        entidade_id: repasse_id,
        dados_novos: updates,
      })

    return NextResponse.json({ repasse, message: 'Repasse processado com sucesso' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
