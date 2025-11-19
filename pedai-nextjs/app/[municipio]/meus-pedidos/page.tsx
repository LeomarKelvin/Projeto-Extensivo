import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import MeusPedidosContent from '@/components/clientes/MeusPedidosContent'

interface Props {
  params: Promise<{ municipio: string }>
}

export default async function MeusPedidosPage({ params }: Props) {
  const { municipio } = await params
  
  const tenant = getTenantBySlug(municipio)
  
  if (!tenant) {
    notFound()
  }

  // Removemos toda a lógica de servidor daqui.
  // O componente MeusPedidosContent vai cuidar de tudo no navegador.

  return (
    <ClientLayout tenant={tenant}>
      <MeusPedidosContent tenant={tenant} />
    </ClientLayout>
  )
}