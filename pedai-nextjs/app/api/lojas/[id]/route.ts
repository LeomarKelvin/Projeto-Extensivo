import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verificarLojaAberta } from '@/lib/utils/shopStatus'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const lojaId = params.id

    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', lojaId)
      .single()

    if (lojaError || !loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    // Verifica horário em tempo real
    const estaAberta = verificarLojaAberta(
      loja.tipo_horario || 'sempre_aberto',
      loja.horarios_funcionamento,
      loja.aberta
    )
    
    // Atualiza o objeto para o front (não precisa esperar salvar no banco)
    const lojaAtualizada = { ...loja, aberta: estaAberta }

    // Busca produtos
    const { data: produtos } = await supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('disponivel', true)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      loja: lojaAtualizada,
      produtos: produtos || []
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}