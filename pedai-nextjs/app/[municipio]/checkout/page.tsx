import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import CheckoutContent from '@/components/clientes/CheckoutContent'

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
    title: `Checkout - ${tenant.name} - PedeAí`,
    description: 'Finalize seu pedido',
  }
}

export default function CheckoutPage({ params }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <CheckoutContent tenant={tenant} />
    </ClientLayout>
  )
}
