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
    const { loja_id, periodo_inicio, periodo_fim } = body

    if (!loja_id || !periodo_inicio || !periodo_fim) {
      return NextResponse.json({ 
        error: 'loja_id, periodo_inicio e periodo_fim são obrigatórios' 
      }, { status: 400 })
    }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('total, taxa_entrega')
      .eq('loja_id', loja_id)
      .gte('created_at', periodo_inicio)
      .lte('created_at', periodo_fim)
      .in('status', ['entregue', 'pronto', 'em_entrega'])

    const { data: loja } = await supabase
      .from('lojas')
      .select('comissao_plataforma')
      .eq('id', loja_id)
      .single()

    const valor_bruto = pedidos?.reduce((sum, p) => sum + parseFloat(p.total || '0'), 0) || 0
    const taxas_entrega = pedidos?.reduce((sum, p) => sum + parseFloat(p.taxa_entrega || '0'), 0) || 0
    const comissao_percentual = loja?.comissao_plataforma || 10
    const comissao_plataforma = (valor_bruto * comissao_percentual) / 100
    const valor_liquido = valor_bruto - comissao_plataforma

    const { data: repasse, error } = await supabase
      .from('repasses_financeiros')
      .insert({
        loja_id,
        periodo_inicio,
        periodo_fim,
        total_pedidos: pedidos?.length || 0,
        valor_bruto,
        comissao_plataforma,
        taxas_entrega,
        valor_liquido,
        status: 'pendente',
        criado_por: perfil.id,
      })
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
        acao: 'GERAR_REPASSE',
        entidade: 'repasses_financeiros',
        entidade_id: repasse.id,
        dados_novos: repasse,
      })

    return NextResponse.json({ repasse, message: 'Repasse gerado com sucesso' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
