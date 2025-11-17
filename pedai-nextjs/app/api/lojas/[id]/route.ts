import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (lojaError) {
      console.error('Erro ao buscar loja:', lojaError)
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('disponivel', true)
      .order('created_at', { ascending: false })

    if (produtosError) {
      console.error('Erro ao buscar produtos:', produtosError)
    }

    return NextResponse.json({
      loja,
      produtos: produtos || []
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
