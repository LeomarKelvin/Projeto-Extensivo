import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import PedidoConfirmacaoContent from '@/components/clientes/PedidoConfirmacaoContent'
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
      title: 'Município não encontrado',
    }
  }

  return {
    title: `Pedido #${params.id} - ${tenant.name} - PedeAí`,
    description: 'Confirmação do seu pedido',
  }
}

async function getPedido(pedidoId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      loja:lojas!inner(id, nome_loja, municipio, url_imagem),
      itens:pedido_itens(
        id,
        quantidade,
        preco_unitario,
        observacao,
        produto:produtos(id, nome, imagem_url)
      )
    `)
    .eq('id', pedidoId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

export default async function PedidoPage({ params }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

  const pedido = await getPedido(params.id)

  if (!pedido) {
    notFound()
  }

  // Verify pedido is from correct municipality
  if (pedido.loja.municipio !== tenant.name) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <PedidoConfirmacaoContent tenant={tenant} pedido={pedido} />
    </ClientLayout>
  )
}
