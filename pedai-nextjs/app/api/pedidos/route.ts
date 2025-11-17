import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/tenantConfig'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { 
      items, 
      endereco, 
      referencia,
      observacoes, 
      forma_pagamento,
      troco_para
    } = body
    
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
    
    // AUTHENTICATION REQUIRED: User must be logged in to create orders
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticação necessária. Faça login para fazer pedidos.' },
        { status: 401 }
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
    
    const perfil_id = perfil.id
    
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
    
    // Verify the loja exists - município is derived FROM the loja (trusted source)
    // This prevents tenant isolation bypass by trusting database state, not client input
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, nome_loja, municipio')
      .eq('id', loja_id)
      .single()
    
    if (lojaError || !loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }
    
    // CRITICAL SECURITY: Validate quantities before any calculations
    for (const item of items) {
      if (!item.quantidade || item.quantidade <= 0 || item.quantidade > 100) {
        return NextResponse.json(
          { error: 'Quantidade inválida. Deve ser entre 1 e 100.' },
          { status: 400 }
        )
      }
      // Ensure quantidade is an integer to prevent decimal exploits
      if (!Number.isInteger(item.quantidade)) {
        return NextResponse.json(
          { error: 'Quantidade deve ser um número inteiro' },
          { status: 400 }
        )
      }
    }
    
    // CRITICAL SECURITY: Fetch actual prices from database to prevent price tampering
    const productIds = items.map((item: any) => item.produto_id)
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id, nome, preco, loja_id')
      .in('id', productIds)
    
    if (produtosError || !produtos) {
      return NextResponse.json(
        { error: 'Erro ao validar produtos' },
        { status: 500 }
      )
    }
    
    // Validate all products exist and belong to the correct loja
    const invalidProducts = produtos.filter((p: any) => p.loja_id !== loja_id)
    if (invalidProducts.length > 0) {
      return NextResponse.json(
        { error: 'Alguns produtos não pertencem a esta loja' },
        { status: 400 }
      )
    }
    
    // Create a map of product prices from database (trusted source)
    const produtoMap = new Map(produtos.map((p: any) => [p.id, p]))
    
    // Calculate server-side pricing (prevent price tampering)
    let subtotal = 0
    const validatedItems = items.map((item: any) => {
      const produto = produtoMap.get(item.produto_id)
      if (!produto) {
        throw new Error(`Produto ${item.produto_id} não encontrado`)
      }
      const itemTotal = produto.preco * item.quantidade
      subtotal += itemTotal
      return {
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: produto.preco, // Use DB price, not client price
        observacao: item.observacao,
      }
    })
    
    // Get tenant config from loja's município for delivery fee calculation
    // Normalize município name to match tenant slug format
    const municipioSlug = loja.municipio
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim()
    
    const tenant = getTenantBySlug(municipioSlug)
    if (!tenant) {
      console.error(`Tenant not found for município: ${loja.municipio}, normalized to: ${municipioSlug}`)
      return NextResponse.json(
        { error: 'Configuração de município não encontrada' },
        { status: 500 }
      )
    }
    
    // Recalculate total with correct delivery fee from loja's tenant
    const taxa_entrega = tenant.delivery.baseFee
    const total = subtotal + taxa_entrega
    
    // Create order
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        perfil_id,
        loja_id,
        endereco_entrega: `${endereco}${referencia ? ` | Ref: ${referencia}` : ''}`,
        observacoes,
        forma_pagamento: forma_pagamento || 'dinheiro',
        troco_para: troco_para || null,
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
    
    // Create order items with server-validated prices
    const itemsToInsert = validatedItems.map((item: any) => ({
      pedido_id: pedido.id,
      ...item,
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
        id: pedido.id,
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
