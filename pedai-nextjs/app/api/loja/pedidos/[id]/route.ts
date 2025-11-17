import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const pedidoId = params.id
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }
    
    const { data: perfil } = await supabase
      .from('perfis')
      .select('id, tipo')
      .eq('user_id', user.id)
      .single()
    
    if (!perfil || perfil.tipo !== 'loja') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas lojistas podem atualizar pedidos.' },
        { status: 403 }
      )
    }
    
    const { data: loja } = await supabase
      .from('lojas')
      .select('id')
      .eq('perfil_id', perfil.id)
      .single()
    
    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const { status } = body
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }
    
    const validStatuses = ['pendente', 'aceito', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }
    
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, loja_id, status')
      .eq('id', pedidoId)
      .single()
    
    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }
    
    if (pedido.loja_id !== loja.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar este pedido' },
        { status: 403 }
      )
    }
    
    const { data: updatedPedido, error: updateError } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', pedidoId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar pedido' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Status atualizado com sucesso',
      pedido: updatedPedido
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
