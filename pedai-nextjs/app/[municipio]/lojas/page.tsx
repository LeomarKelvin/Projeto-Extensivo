import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import LojasContent from '@/components/clientes/LojasContent'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: {
    municipio: string
  }
  searchParams: {
    categoria?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = getTenantBySlug(params.municipio)
  
  if (!tenant) {
    return {
      title: 'Município não encontrado',
    }
  }

  return {
    title: `Lojas em ${tenant.name} - PedeAí`,
    description: `Descubra as melhores lojas de ${tenant.name}. Comida, mercado, farmácia e muito mais!`,
  }
}

async function getLojas(municipio: string) {
  const supabase = await createClient()
  
  const { data, error} = await supabase
    .from('lojas')
    .select('*')
    .eq('municipio', municipio)
    .eq('aprovada', true)
    .order('nome_loja')
  
  if (error) {
    console.error('Erro ao carregar lojas:', error)
    return []
  }
  
  return data || []
}

export default async function LojasPage({ params, searchParams }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

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
