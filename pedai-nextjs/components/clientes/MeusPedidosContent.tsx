'use client'

import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'

interface Perfil {
  id: number
  nome_completo: string
  email: string
}

interface Loja {
  id: number
  nome_loja: string
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
  numero_pedido: string
  status: string
  valor_total: number
  taxa_entrega: number
  endereco_entrega: string
  forma_pagamento: string
  created_at: string
  lojas: Loja
  pedido_itens: PedidoItem[]
}

interface MeusPedidosContentProps {
  pedidos: Pedido[]
  tenant: TenantConfig
  perfil: Perfil
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  confirmado: { label: 'Confirmado', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  preparando: { label: 'Preparando', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  em_entrega: { label: 'Em Entrega', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  entregue: { label: 'Entregue', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  cancelado: { label: 'Cancelado', color: 'text-red-500', bgColor: 'bg-red-500/10' },
}

export default function MeusPedidosContent({ pedidos, tenant, perfil }: MeusPedidosContentProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href={`/${tenant.slug}`} className="hover:text-tenant-primary transition-colors">
              Início
            </Link>
            <span>›</span>
            <span className="text-white">Meus Pedidos</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Meus Pedidos
          </h1>
          <p className="text-gray-400">
            Olá, {perfil.nome_completo.split(' ')[0]}! Acompanhe seus pedidos aqui
          </p>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="container mx-auto px-4 py-8">
        {pedidos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Você ainda não fez nenhum pedido
            </h3>
            <p className="text-gray-400 mb-6">
              Explore as lojas e faça seu primeiro pedido!
            </p>
            <Link
              href={`/${tenant.slug}/lojas`}
              className="inline-block px-8 py-3 bg-tenant-primary text-tenant-secondary rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Ver Lojas
            </Link>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {pedidos.map((pedido) => {
              const statusInfo = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.pendente
              const dataFormatada = new Date(pedido.created_at).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={pedido.id}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-tenant-primary transition-colors"
                >
                  {/* Cabeçalho do Pedido */}
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            Pedido #{pedido.numero_pedido}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          📅 {dataFormatada}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Loja</div>
                        <div className="font-semibold text-white">
                          {pedido.lojas.nome_loja}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="p-6 bg-gray-900/50">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">
                      Itens do Pedido
                    </h4>
                    <div className="space-y-2">
                      {pedido.pedido_itens.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-tenant-primary font-medium">
                              {item.quantidade}x
                            </span>
                            <span className="text-white">{item.nome_produto}</span>
                          </div>
                          <span className="text-gray-400">
                            R$ {item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rodapé do Pedido */}
                  <div className="p-6 border-t border-gray-700">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">
                          R$ {(pedido.valor_total - pedido.taxa_entrega).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Taxa de Entrega</span>
                        <span className="text-white">
                          R$ {pedido.taxa_entrega.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-tenant-primary">
                          R$ {pedido.valor_total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Endereço:</span> {pedido.endereco_entrega}
                      </div>
                      <div>
                        <span className="font-medium">Pagamento:</span>{' '}
                        {pedido.forma_pagamento === 'dinheiro' && 'Dinheiro'}
                        {pedido.forma_pagamento === 'pix' && 'PIX'}
                        {pedido.forma_pagamento === 'cartao' && 'Cartão'}
                      </div>
                    </div>
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
