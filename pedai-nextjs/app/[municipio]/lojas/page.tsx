import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import LojasContent from '@/components/clientes/LojasContent'

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
    title: `Lojas em ${tenant.name} - PedeAí`,
    description: `Descubra as melhores lojas de ${tenant.name}. Comida, mercado, farmácia e muito mais!`,
  }
}

export default function LojasPage({ params }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <LojasContent tenant={tenant} />
    </ClientLayout>
  )
}
