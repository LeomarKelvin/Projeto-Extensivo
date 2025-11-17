import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SimpleHeader from '@/components/SimpleHeader'
import Footer from '@/components/Footer'
import ClientLayout from '@/components/ClientLayout'
import LojaDetalhesContent from '@/components/clientes/LojaDetalhesContent'
import { getTenantBySlug, isTenantValid } from '@/lib/tenantConfig'

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

export default function LojaPage({ params }: PageProps) {
  if (!isTenantValid(params.municipio)) {
    notFound()
  }

  const tenant = getTenantBySlug(params.municipio)!

  return (
    <ClientLayout tenant={tenant}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <SimpleHeader tenant={tenant} />
        <main className="flex-1">
          <LojaDetalhesContent tenant={tenant} lojaId={params.id} />
        </main>
        <Footer tenant={tenant} />
      </div>
    </ClientLayout>
  )
}
