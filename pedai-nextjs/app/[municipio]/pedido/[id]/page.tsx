'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import PedidoConfirmacaoContent from '@/components/clientes/PedidoConfirmacaoContent'
import { createClient } from '@/lib/supabase/client'

export default function PedidoPage() {
  const params = useParams()
  const municipio = params.municipio as string
  const id = params.id as string
  
  const [pedido, setPedido] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const tenant = getTenantBySlug(municipio)

  useEffect(() => {
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
  }, [id, tenant])

  if (!tenant) {
    notFound()
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
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <PedidoConfirmacaoContent tenant={tenant} pedido={pedido} />
    </ClientLayout>
  )
}
