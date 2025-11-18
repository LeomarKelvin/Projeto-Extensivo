import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import ClientLayout from '@/components/ClientLayout'
import LojaDetalhesContent from '@/components/clientes/LojaDetalhesContent'
import { getTenantBySlug, isTenantValid } from '@/lib/tenantConfig'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: {
    municipio: string
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = getTenantBySlug(params.municipio)
  
  if (!tenant) {
    return {
      title: 'Município não encontrado'
    }
  }

  return {
    title: `Loja - ${tenant.name} | PedeAí`,
    description: `Detalhes da loja em ${tenant.name}`
  }
}

async function getLojaDetalhes(lojaId: string, municipio: string) {
  const supabase = await createClient()
  
  // Buscar loja
  const { data: loja, error: lojaError } = await supabase
    .from('lojas')
    .select('*')
    .eq('id', lojaId)
    .eq('municipio', municipio)
    .single()
  
  // Filter aprovada in JavaScript (Supabase schema cache issue)
  if (lojaError || !loja || loja.aprovada !== true) {
    return null
  }
  
  // Buscar produtos da loja
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', lojaId)
    .eq('disponivel', true)
    .order('nome')
  
  return {
    loja,
    produtos: produtos || []
  }
}

export default async function LojaPage({ params }: PageProps) {
  if (!isTenantValid(params.municipio)) {
    notFound()
  }

  const tenant = getTenantBySlug(params.municipio)!
  const data = await getLojaDetalhes(params.id, tenant.slug)

  if (!data) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <main className="flex-1">
          <LojaDetalhesContent 
            tenant={tenant} 
            loja={data.loja}
            produtos={data.produtos}
          />
        </main>
        <Footer tenant={tenant} />
      </div>
    </ClientLayout>
  )
}
