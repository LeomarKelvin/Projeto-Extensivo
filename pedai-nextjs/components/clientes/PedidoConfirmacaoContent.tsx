'use client'

import { useRouter } from 'next/navigation'
import type { TenantConfig } from '@/lib/types/tenant'

interface PedidoConfirmacaoContentProps {
  tenant: TenantConfig
  pedido: any
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendente: { label: 'Aguardando Confirmação', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: '⏳' },
  aceito: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: '👨‍🍳' },
  preparando: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: '🔥' },
  pronto: { label: 'Pronto para Entrega', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: '📦' },
  em_entrega: { label: 'Saiu para Entrega', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20', icon: '🛵' },
  entregue: { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: '✅' },
  cancelado: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-900/20 border-red-900/30', icon: '❌' },
}

export default function PedidoConfirmacaoContent({ tenant, pedido }: PedidoConfirmacaoContentProps) {
  const router = useRouter()
  const statusInfo = STATUS_CONFIG[pedido.status] || STATUS_CONFIG['pendente']

  const formatPayment = (forma: string) => {
    const map: Record<string, string> = { dinheiro: '💵 Dinheiro', pix: '💠 Pix', cartao: '💳 Cartão' }
    return map[forma] || forma
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Botão Voltar ao Menu Anterior */}
        <button 
          onClick={() => router.back()} 
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Voltar
        </button>

        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Pedido #{pedido.id}</h2>
              <p className="text-gray-400 text-sm mt-1">{new Date(pedido.created_at).toLocaleString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${statusInfo.bg} ${statusInfo.color} font-bold text-sm flex items-center gap-2`}>
              <span>{statusInfo.icon}</span><span className="uppercase tracking-wide">{statusInfo.label}</span>
            </div>
          </div>
          {/* Card de Tempo REMOVIDO daqui */}
        </div>

        {/* Itens */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🛍️ Itens do Pedido</h3>
          <div className="space-y-4">
            {pedido.itens?.map((item: any) => (
              <div key={item.id} className="flex gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {item.produto?.imagem_url ? <img src={item.produto.imagem_url} className="w-full h-full object-cover" /> : '🍽️'}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-medium"><span className="text-tenant-primary font-bold mr-2">{item.quantidade}x</span>{item.produto?.nome || 'Produto'}</p>
                    <p className="text-white font-bold text-sm">R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</p>
                  </div>
                  {item.observacao && <p className="text-gray-400 text-xs mt-1 bg-gray-800/80 p-1 rounded inline-block self-start border border-gray-700">Obs: {item.observacao}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">📍 Entrega</h3>
            <div className="space-y-3 text-sm">
              <div><p className="text-gray-400 text-xs uppercase font-bold mb-1">Endereço</p><p className="text-white bg-gray-900 p-3 rounded-lg border border-gray-700">{pedido.endereco_entrega}</p></div>
              {pedido.observacoes && <div><p className="text-gray-400 text-xs uppercase font-bold mb-1">Nota do Pedido</p><p className="text-white bg-gray-900 p-3 rounded-lg border border-gray-700 italic">"{pedido.observacoes}"</p></div>}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">💰 Pagamento</h3>
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-4"><span>Forma:</span><span className="font-bold text-white bg-gray-700 px-2 py-1 rounded">{formatPayment(pedido.forma_pagamento || 'dinheiro')}</span></div>
              {pedido.troco_para && <p className="text-sm text-gray-400 mb-4">Troco para: <span className="text-white font-bold">R$ {pedido.troco_para.toFixed(2)}</span></p>}
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-gray-400 text-sm"><span>Subtotal</span><span>R$ {(pedido.total - pedido.taxa_entrega).toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-400 text-sm"><span>Taxa de Entrega</span><span>R$ {pedido.taxa_entrega.toFixed(2)}</span></div>
              <div className="flex justify-between text-white text-xl font-bold pt-2"><span>Total</span><span className="text-tenant-primary">R$ {pedido.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button onClick={() => router.push(`/${tenant.slug}/lojas`)} className="flex-1 py-4 bg-tenant-primary text-tenant-secondary font-bold text-lg rounded-xl hover:opacity-90 transition-all shadow-lg hover:-translate-y-1">Fazer Novo Pedido</button>
          <button onClick={() => router.push(`/${tenant.slug}/meus-pedidos`)} className="flex-1 py-4 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors">Meus Pedidos</button>
        </div>

      </div>
    </div>
  )
}