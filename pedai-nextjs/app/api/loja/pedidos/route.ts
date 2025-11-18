import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header (for localStorage-based auth)
    const authHeader = request.headers.get('Authorization')
    let user = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Verify token with Supabase
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (!tokenError && tokenUser) {
        user = tokenUser
      }
    }

    // Fallback to cookie-based auth
    if (!user) {
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: userError } = await supabase.auth.getUser()
      
      if (!userError && cookieUser) {
        user = cookieUser
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id, tipo')
      .eq('user_id', user.id)
      .single()
    
    if (!perfil || (perfil.tipo !== 'loja' && perfil.tipo !== 'admin')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas lojistas e administradores podem acessar esta funcionalidade.' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const lojaIdParam = searchParams.get('loja_id')
    
    // Determinar loja_id baseado no tipo de usuário
    let lojaId: number
    let loja: any
    
    if (perfil.tipo === 'loja') {
      // Lojista só pode ver sua própria loja
      const { data: lojaData } = await supabaseAdmin
        .from('lojas')
        .select('id, nome_loja')
        .eq('perfil_id', perfil.id)
        .single()
      
      if (!lojaData) {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 }
        )
      }
      
      lojaId = lojaData.id
      loja = lojaData
    } else {
      // Admin pode especificar loja via query param
      if (!lojaIdParam) {
        return NextResponse.json(
          { error: 'loja_id é obrigatório para admin' },
          { status: 400 }
        )
      }
      
      const { data: lojaData } = await supabaseAdmin
        .from('lojas')
        .select('id, nome_loja')
        .eq('id', parseInt(lojaIdParam))
        .single()
      
      if (!lojaData) {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 }
        )
      }
      
      lojaId = lojaData.id
      loja = lojaData
    }
    
    let query = supabaseAdmin
      .from('pedidos')
      .select(`
        id,
        status,
        total,
        subtotal,
        taxa_entrega,
        endereco_entrega,
        forma_pagamento,
        observacoes,
        created_at,
        perfil:perfis!pedidos_perfil_id_fkey (
          nome_completo,
          telefone
        )
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false })
    
    if (status && status !== 'todos') {
      query = query.eq('status', status)
    }
    
    const { data: pedidos, error: pedidosError } = await query
    
    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }
    
    const pedidosWithItems = await Promise.all(
      pedidos.map(async (pedido) => {
        const { data: items } = await supabaseAdmin
          .from('pedido_itens')
          .select(`
            quantidade,
            preco_unitario,
            observacao,
            produto:produtos!pedido_itens_produto_id_fkey (
              id,
              nome
            )
          `)
          .eq('pedido_id', pedido.id)
        
        return {
          ...pedido,
          items: items || []
        }
      })
    )
    
    return NextResponse.json({
      pedidos: pedidosWithItems,
      loja
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
