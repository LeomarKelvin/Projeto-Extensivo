import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verificarLojaAberta } from '@/lib/utils/shopStatus'

// FORÇA O NEXT.JS A NÃO FAZER CACHE DESTA ROTA
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const municipio = searchParams.get('municipio')
    const categoria = searchParams.get('categoria')
    
    if (!municipio) {
      return NextResponse.json({ error: 'Município é obrigatório' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    let query = supabase
      .from('lojas')
      .select('*')
      .eq('municipio', municipio)
      .eq('aprovada', true) // Só mostra lojas aprovadas
    
    if (categoria && categoria !== 'todas') {
      query = query.eq('categoria', categoria)
    }
    
    const { data: lojas, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error

    // Recalcula status de aberto/fechado em tempo real
    const lojasAtualizadas = lojas.map((loja) => {
      const estaAberta = verificarLojaAberta(
        loja.tipo_horario || 'sempre_aberto',
        loja.horarios_funcionamento,
        loja.aberta
      )
      return { ...loja, aberta: estaAberta }
    })
    
    return NextResponse.json(lojasAtualizadas)

  } catch (error: any) {
    console.error('Erro na API de lojas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}