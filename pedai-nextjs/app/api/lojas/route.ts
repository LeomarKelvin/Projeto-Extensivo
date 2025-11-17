import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const municipio = searchParams.get('municipio')
    const categoria = searchParams.get('categoria')
    
    // Validate that municipio is provided for tenant isolation
    if (!municipio) {
      return NextResponse.json(
        { error: 'Município é obrigatório' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Always filter by municipio for tenant isolation
    let query = supabase
      .from('lojas')
      .select('*')
      .eq('municipio', municipio)
    
    if (categoria && categoria !== 'todas') {
      query = query.eq('categoria', categoria)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar lojas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar lojas' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro no endpoint de lojas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
