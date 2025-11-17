import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import CarrinhoContent from '@/components/clientes/CarrinhoContent'

interface PageProps {
  params: {
    municipio: string
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
    title: `Carrinho - ${tenant.name} - PedeAí`,
    description: 'Finalize seu pedido',
  }
}

export default function CarrinhoPage({ params }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <CarrinhoContent tenant={tenant} />
    </ClientLayout>
  )
}
