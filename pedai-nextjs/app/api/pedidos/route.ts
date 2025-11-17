import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { items, endereco, observacoes, taxa_entrega, total } = body
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      )
    }
    
    if (!endereco) {
      return NextResponse.json(
        { error: 'Endereço de entrega é obrigatório' },
        { status: 400 }
      )
    }
    
    // Get user profile - only clientes can create orders
    const { data: perfil } = await supabase
      .from('perfis')
      .select('id, tipo')
      .eq('user_id', user.id)
      .single()
    
    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }
    
    if (perfil.tipo !== 'cliente') {
      return NextResponse.json(
        { error: 'Apenas clientes podem criar pedidos' },
        { status: 403 }
      )
    }
    
    // Get loja_id from first item (assuming single-store cart)
    const loja_id = items[0].loja_id
    
    // Verify all items are from the same loja
    const allSameLoja = items.every((item: any) => item.loja_id === loja_id)
    if (!allSameLoja) {
      return NextResponse.json(
        { error: 'Todos os itens devem ser da mesma loja' },
        { status: 400 }
      )
    }
    
    // Verify the loja exists and is active
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, nome_loja, municipio, ativo')
      .eq('id', loja_id)
      .single()
    
    if (lojaError || !loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }
    
    if (!loja.ativo) {
      return NextResponse.json(
        { error: 'Loja não está ativa no momento' },
        { status: 400 }
      )
    }
    
    // NOTE: Tenant isolation is enforced at the UI level (storefront filters by municipio)
    // For strict tenant isolation, perfis table would need a municipio column
    // See SECURITY_NOTE.md for details and future enhancements
    
    // Create order
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        perfil_id: perfil.id,
        loja_id,
        endereco_entrega: endereco,
        observacoes,
        taxa_entrega,
        total,
        status: 'pendente',
      })
      .select()
      .single()
    
    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError)
      return NextResponse.json(
        { error: 'Erro ao criar pedido' },
        { status: 500 }
      )
    }
    
    // Create order items
    const itemsToInsert = items.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      observacao: item.observacao,
    }))
    
    const { error: itemsError } = await supabase
      .from('pedido_itens')
      .insert(itemsToInsert)
    
    if (itemsError) {
      console.error('Erro ao criar itens do pedido:', itemsError)
      // Rollback: delete the order
      await supabase.from('pedidos').delete().eq('id', pedido.id)
      return NextResponse.json(
        { error: 'Erro ao criar itens do pedido' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        message: 'Pedido criado com sucesso!',
        pedido,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao processar pedido:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    // Get user profile
    const { data: perfil } = await supabase
      .from('perfis')
      .select('id, tipo')
      .eq('user_id', user.id)
      .single()
    
    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }
    
    // Get municipio from query param for tenant validation
    const searchParams = request.nextUrl.searchParams
    const municipio = searchParams.get('municipio')
    
    // Build base query with JOIN to lojas for municipio filtering
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        loja:lojas!inner(id, nome_loja, municipio),
        perfil:perfis(nome_completo)
      `)
    
    // Filter based on user type AND enforce tenant isolation
    if (perfil.tipo === 'cliente') {
      // Clientes only see their own orders
      query = query.eq('perfil_id', perfil.id)
      
      // If municipio is provided, enforce server-side filter (tenant isolation)
      if (municipio) {
        query = query.eq('loja.municipio', municipio)
      }
    } else if (perfil.tipo === 'loja') {
      // Get loja data
      const { data: loja } = await supabase
        .from('lojas')
        .select('id, municipio')
        .eq('user_id', user.id)
        .single()
      
      if (!loja) {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 }
        )
      }
      
      // Lojas only see orders for their own store (automatic tenant isolation)
      query = query.eq('loja_id', loja.id)
      
      // Double-check municipio matches if provided
      if (municipio && loja.municipio !== municipio) {
        return NextResponse.json(
          { error: 'Município não corresponde à loja' },
          { status: 403 }
        )
      }
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
