import { Metadata } from 'next'
import { getTenantBySlug, isTenantValid } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import ClientePerfilContent from '@/components/clientes/ClientePerfilContent'

export const metadata: Metadata = {
  title: 'Meu Perfil - PedeAí',
  description: 'Gerencie seus dados e endereços',
}

interface PageProps {
  params: Promise<{ municipio: string }>
}

export default async function PerfilPage({ params }: PageProps) {
  const { municipio } = await params

  if (!isTenantValid(municipio)) {
    notFound()
  }

  const tenant = getTenantBySlug(municipio)!

  return (
    <ClientLayout tenant={tenant}>
      <ClientePerfilContent tenant={tenant} />
    </ClientLayout>
  )
}