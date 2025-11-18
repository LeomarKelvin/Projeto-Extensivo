'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenantConfig'
import ClientLayout from '@/components/ClientLayout'
import PedidoConfirmacaoContent from '@/components/clientes/PedidoConfirmacaoContent'
import { createClient } from '@/lib/supabase/client'

export default function PedidoPage() {
  const params = useParams()
  const router = useRouter()
  const municipio = params.municipio as string
  const id = params.id as string
  
  const [pedido, setPedido] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const tenant = getTenantBySlug(municipio)

  useEffect(() => {
    // Redirect if tenant not found
    if (!tenant) {
      router.replace('/')
      return
    }

    async function fetchPedido() {
      try {
        const supabase = createClient()
        
        const { data, error: fetchError } = await supabase
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
          .eq('id', id)
          .single()
        
        if (fetchError || !data) {
          console.error('Erro ao buscar pedido:', fetchError)
          setError(true)
          setLoading(false)
          return
        }
        
        // Verify pedido is from correct municipality
        if (data.loja.municipio !== tenant?.name) {
          setError(true)
          setLoading(false)
          return
        }
        
        setPedido(data)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar pedido:', err)
        setError(true)
        setLoading(false)
      }
    }
    
    if (tenant) {
      fetchPedido()
    }
  }, [id, tenant, router])

  if (!tenant) {
    return null // Will redirect via useEffect
  }

  if (loading) {
    return (
      <ClientLayout tenant={tenant}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tenant-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando pedido...</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error || !pedido) {
    return (
      <ClientLayout tenant={tenant}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-4 text-center">
            <div className="text-6xl mb-6">😔</div>
            <h1 className="text-3xl font-bold text-white mb-4">Pedido não encontrado</h1>
            <p className="text-gray-400 mb-8">
              Não conseguimos encontrar este pedido. Ele pode ter sido cancelado ou você não tem permissão para visualizá-lo.
            </p>
            <button
              onClick={() => router.push(`/${municipio}/meus-pedidos`)}
              className="w-full py-3 px-6 bg-tenant-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity mb-3"
            >
              Ver meus pedidos
            </button>
            <button
              onClick={() => router.push(`/${municipio}`)}
              className="w-full py-3 px-6 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout tenant={tenant}>
      <PedidoConfirmacaoContent tenant={tenant} pedido={pedido} />
    </ClientLayout>
  )
}
