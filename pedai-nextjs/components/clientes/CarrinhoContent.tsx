'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'
import type { TenantConfig } from '@/lib/types/tenant'
import { useState } from 'react'

interface CarrinhoContentProps {
  tenant: TenantConfig
}

export default function CarrinhoContent({ tenant }: CarrinhoContentProps) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const taxaEntrega = tenant.delivery.baseFee
  const totalComEntrega = total + taxaEntrega

  const handleFinalizarPedido = async () => {
    if (!endereco.trim()) {
      alert('Por favor, informe o endereço de entrega')
      return
    }

    if (total < tenant.delivery.minOrder) {
      alert(`O pedido mínimo é de R$ ${tenant.delivery.minOrder.toFixed(2)}`)
      return
    }

    // TODO: Criar pedido no backend
    console.log('Finalizando pedido:', {
      items,
      endereco,
      observacoes,
      taxaEntrega,
      total: totalComEntrega,
    })

    // For now, just show success and clear cart
    alert('Pedido realizado com sucesso!')
    clearCart()
    router.push(`/${tenant.slug}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-white mb-4">Carrinho Vazio</h2>
          <p className="text-gray-400 mb-8">Adicione produtos para continuar</p>
          <button
            onClick={() => router.push(`/${tenant.slug}/lojas`)}
            className="px-8 py-3 bg-tenant-primary text-tenant-secondary font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Ver Lojas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Carrinho</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl p-6 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-3xl">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    '🍔'
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{item.nome}</h3>
                  <p className="text-gray-400 text-sm">{item.loja_nome}</p>
                  <p className="text-tenant-primary font-bold mt-1">
                    R$ {item.preco.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                    className="w-8 h-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-white font-semibold w-8 text-center">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                    className="w-8 h-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-400 transition-colors ml-4"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-300 mb-2">
                    Endereço de Entrega
                  </label>
                  <input
                    id="endereco"
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-300 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: sem cebola, bem passado..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-700 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Taxa de Entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold border-t border-gray-700 pt-3">
                  <span>Total</span>
                  <span className="text-tenant-primary">R$ {totalComEntrega.toFixed(2)}</span>
                </div>
              </div>

              {total < tenant.delivery.minOrder && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg text-yellow-500 text-sm">
                  Pedido mínimo: R$ {tenant.delivery.minOrder.toFixed(2)}
                </div>
              )}

              <button
                onClick={handleFinalizarPedido}
                disabled={total < tenant.delivery.minOrder}
                className="w-full mt-6 py-4 bg-tenant-primary text-tenant-secondary font-bold text-lg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
