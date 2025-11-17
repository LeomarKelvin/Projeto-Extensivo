'use client'

import { useRouter } from 'next/navigation'
import type { TenantConfig } from '@/lib/types/tenant'
import { useEffect } from 'react'

interface PedidoConfirmacaoContentProps {
  tenant: TenantConfig
  pedido: any
}

export default function PedidoConfirmacaoContent({ tenant, pedido }: PedidoConfirmacaoContentProps) {
  const router = useRouter()

  // Celebração visual ao carregar
  useEffect(() => {
    // Opcional: Adicionar confetti ou animação de sucesso
  }, [])

  const statusColors: Record<string, string> = {
    'pendente': 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
    'confirmado': 'bg-blue-500/20 text-blue-500 border-blue-500',
    'preparando': 'bg-orange-500/20 text-orange-500 border-orange-500',
    'saiu_entrega': 'bg-purple-500/20 text-purple-500 border-purple-500',
    'entregue': 'bg-green-500/20 text-green-500 border-green-500',
    'cancelado': 'bg-red-500/20 text-red-500 border-red-500',
  }

  const statusLabels: Record<string, string> = {
    'pendente': 'Aguardando Confirmação',
    'confirmado': 'Confirmado',
    'preparando': 'Em Preparação',
    'saiu_entrega': 'Saiu para Entrega',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado',
  }

  const statusIcon: Record<string, string> = {
    'pendente': '⏳',
    'confirmado': '✅',
    'preparando': '👨‍🍳',
    'saiu_entrega': '🚚',
    'entregue': '🎉',
    'cancelado': '❌',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPayment = (formaPagamento: string) => {
    const payments: Record<string, string> = {
      'dinheiro': '💵 Dinheiro',
      'pix': '📱 PIX',
      'cartao': '💳 Cartão',
    }
    return payments[formaPagamento] || formaPagamento
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-500/20 to-tenant-primary/20 border border-green-500 rounded-xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Pedido Realizado com Sucesso!</h1>
          <p className="text-gray-300 text-lg">
            Seu pedido foi recebido e será processado em breve
          </p>
        </div>

        {/* Pedido Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Pedido #{pedido.id}</h2>
              <p className="text-gray-400 text-sm mt-1">{formatDate(pedido.created_at)}</p>
            </div>
            <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusColors[pedido.status] || statusColors['pendente']}`}>
              {statusIcon[pedido.status]} {statusLabels[pedido.status] || pedido.status}
            </div>
          </div>

          {/* Loja Info */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">🏪 Informações da Loja</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-3xl">
                {pedido.loja.url_imagem ? (
                  <img src={pedido.loja.url_imagem} alt={pedido.loja.nome_loja} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  '🏪'
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{pedido.loja.nome_loja}</p>
                <p className="text-gray-400 text-sm">{pedido.loja.municipio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">🛍️ Itens do Pedido</h3>
          <div className="space-y-3">
            {pedido.itens?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg">
                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-2xl">
                  {item.produto?.imagem_url ? (
                    <img src={item.produto.imagem_url} alt={item.produto.nome} className="w-full h-full object-cover rounded" />
                  ) : (
                    '🍔'
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{item.produto?.nome || 'Produto'}</p>
                  {item.observacao && (
                    <p className="text-gray-400 text-sm">Obs: {item.observacao}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{item.quantidade}x</p>
                  <p className="text-white font-semibold">R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Detalhes</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Endereço de Entrega</p>
              <p className="text-white">{pedido.endereco_entrega}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Forma de Pagamento</p>
              <p className="text-white">{formatPayment(pedido.forma_pagamento || 'dinheiro')}</p>
              {pedido.troco_para && (
                <p className="text-gray-400 text-sm">Troco para: R$ {parseFloat(pedido.troco_para).toFixed(2)}</p>
              )}
            </div>

            {pedido.observacoes && (
              <div>
                <p className="text-gray-400 text-sm">Observações</p>
                <p className="text-white">{pedido.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">💰 Resumo do Pagamento</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>R$ {(pedido.total - pedido.taxa_entrega).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Taxa de Entrega</span>
              <span>R$ {pedido.taxa_entrega.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white text-xl font-bold border-t border-gray-700 pt-3">
              <span>Total</span>
              <span className="text-tenant-primary">R$ {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tempo Estimado */}
        <div className="bg-gradient-to-r from-tenant-primary/10 to-transparent border border-tenant-primary/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">⏰</div>
            <div>
              <p className="text-white font-semibold">Tempo Estimado de Entrega</p>
              <p className="text-tenant-primary text-2xl font-bold">30-45 minutos</p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(`/${tenant.slug}/lojas`)}
            className="flex-1 py-4 bg-tenant-primary text-tenant-secondary font-bold text-lg rounded-lg hover:opacity-90 transition-opacity"
          >
            Fazer Novo Pedido
          </button>
          <button
            onClick={() => router.push(`/${tenant.slug}`)}
            className="flex-1 py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  )
}
