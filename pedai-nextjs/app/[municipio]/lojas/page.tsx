import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import LojasContent from '@/components/clientes/LojasContent'
import { createClient } from '@/lib/supabase/server'
import { verificarLojaAberta } from '@/lib/utils/shopStatus'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ municipio: string }>
  searchParams: { categoria?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { municipio } = await params
  const tenant = getTenantBySlug(municipio)
  if (!tenant) return { title: 'Município não encontrado' }
  return {
    title: `Lojas em ${tenant.name} - PedeAí`,
    description: `Descubra as melhores lojas de ${tenant.name}.`,
  }
}

async function getLojas(municipio: string) {
  const supabase = await createClient()
  
  // REMOVI O FILTRO .eq('aprovada', true) PARA SUAS LOJAS APARECEREM
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .eq('municipio', municipio)
    .order('nome_loja')
  
  if (error) {
    console.error('Erro ao carregar lojas:', error)
    return []
  }

  // Recalcula status
  const lojasAtualizadas = data?.map((loja: any) => {
    const estaAberta = verificarLojaAberta(
      loja.tipo_horario, 
      loja.horarios_funcionamento, 
      loja.aberta
    )
    return { ...loja, aberta: estaAberta }
  })
  
  // Ordena: Abertas primeiro
  return lojasAtualizadas.sort((a, b) => Number(b.aberta) - Number(a.aberta))
}

export default async function LojasPage({ params, searchParams }: PageProps) {
  const { municipio } = await params
  const tenant = getTenantBySlug(municipio)

  if (!tenant) notFound()

  const lojas = await getLojas(tenant.slug)

  return (
    <ClientLayout tenant={tenant}>
      <LojasContent 
        tenant={tenant} 
        initialLojas={lojas}
        categoriaInicial={searchParams.categoria || 'todas'}
      />
    </ClientLayout>
  )
}