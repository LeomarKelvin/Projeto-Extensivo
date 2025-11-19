'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TenantConfig } from '@/lib/types/tenant'

interface Perfil {
  id: number
  nome_completo: string
  email: string
}

interface Loja {
  id: number
  nome_loja: string
  url_imagem?: string
}

interface PedidoItem {
  id: number
  produto_id: number
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

interface Pedido {
  id: number
  status: string
  valor_total: number // O banco usa 'total', mas vamos mapear
  total: number
  taxa_entrega: number
  endereco_entrega: string
  forma_pagamento: string
  created_at: string
  lojas: Loja
  pedido_itens: PedidoItem[]
}

interface MeusPedidosContentProps {
  pedidos: any[] // Recebe inicial do server
  tenant: TenantConfig
  perfil: Perfil
}

// Configuração Visual dos Status
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pendente: { label: 'Aguardando Confirmação', color: 'text-yellow-400', bg: 'bg-yellow-400/10', step: 1 },
  aceito: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10', step: 2 },
  preparando: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10', step: 2 },
  pronto: { label: 'Pronto para Entrega', color: 'text-green-400', bg: 'bg-green-400/10', step: 3 },
  em_entrega: { label: 'Saiu para Entrega', color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 4 },
  entregue: { label: 'Entregue', color: 'text-gray-400', bg: 'bg-gray-800', step: 5 },
  cancelado: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-900/20', step: 0 },
}

export default function MeusPedidosContent({ pedidos: initialPedidos, tenant, perfil }: MeusPedidosContentProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos || [])

  // Escuta atualizações em tempo real (Para o cliente ver o status mudar)
  useEffect(() => {
    const supabase = createClient()
    
    // Inscreve no canal para ouvir mudanças na tabela 'pedidos'
    const channel = supabase
      .channel('meus-pedidos-cliente')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `perfil_id=eq.${perfil.id}` // Só escuta os meus pedidos
        },
        (payload) => {
          console.log("Status atualizado!", payload)
          // Atualiza o pedido específico na lista
          setPedidos((current) => 
            current.map((p) => 
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [perfil.id])

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${tenant.slug}`} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold text-white">Meus Pedidos</h1>
          </div>
          <div className="text-xs text-gray-500">
            Atualização em tempo real ⚡
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {pedidos.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido ainda</h3>
            <p className="text-gray-400 mb-6">Bateu a fome? Peça agora!</p>
            <Link href={`/${tenant.slug}/lojas`} className="px-6 py-3 bg-tenant-primary text-tenant-secondary rounded-lg font-bold">
              Ver Lojas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => {
              const status = STATUS_CONFIG[pedido.status] || STATUS_CONFIG['pendente']
              const data = new Date(pedido.created_at).toLocaleDateString('pt-BR')
              const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              
              // Calcula progresso (0 a 100%)
              const progress = status.step > 0 ? Math.min((status.step / 4) * 100, 100) : 0

              return (
                <div key={pedido.id} className={`rounded-xl border border-gray-700 overflow-hidden bg-gray-800 shadow-lg transition-all hover:border-gray-600`}>
                  
                  {/* Topo: Loja e Status */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                         {pedido.lojas?.url_imagem ? <img src={pedido.lojas.url_imagem} className="w-full h-full object-cover rounded-lg"/> : '🏪'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{pedido.lojas?.nome_loja || 'Loja'}</h3>
                        <p className="text-gray-500 text-xs">Pedido #{pedido.id} • {data} às {hora}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${status.color} ${status.bg} border-current`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso (Visual de Rastreio) */}
                  {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                    <div className="px-4 pb-4">
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-tenant-primary transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {progress < 100 ? 'Acompanhe o status...' : 'Chegando!'}
                      </p>
                    </div>
                  )}

                  {/* Detalhes (Colapsável ou Resumo) */}
                  <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-gray-300 space-y-1">
                         {pedido.pedido_itens?.map((item, i) => (
                           <div key={i} className="line-clamp-1">
                             <span className="text-tenant-primary font-bold">{item.quantidade}x</span> {item.nome_produto}
                           </div>
                         ))}
                         {pedido.pedido_itens?.length > 2 && <div className="text-xs text-gray-500 italic">+ mais itens...</div>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-xl font-bold text-white">
                          R$ {pedido.total ? pedido.total.toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ajuda/Detalhes */}
                  <div className="bg-gray-900/50 p-3 text-center border-t border-gray-700/50">
                    <Link href={`/${tenant.slug}/pedido/${pedido.id}`} className="text-sm text-tenant-primary hover:underline font-medium">
                      Ver detalhes completos
                    </Link>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}