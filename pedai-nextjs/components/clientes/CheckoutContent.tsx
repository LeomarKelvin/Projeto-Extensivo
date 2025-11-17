'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'
import type { TenantConfig } from '@/lib/types/tenant'

interface CheckoutContentProps {
  tenant: TenantConfig
}

export default function CheckoutContent({ tenant }: CheckoutContentProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push(`/${tenant.slug}/carrinho`)
    }
  }, [items, router, tenant])

  // Form state
  const [formData, setFormData] = useState({
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
    formaPagamento: 'dinheiro',
    trocoPara: '',
    observacoes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const taxaEntrega = tenant.delivery.baseFee
  const totalComEntrega = total + taxaEntrega

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.rua.trim()) newErrors.rua = 'Rua é obrigatória'
    if (!formData.numero.trim()) newErrors.numero = 'Número é obrigatório'
    if (!formData.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório'
    
    if (formData.formaPagamento === 'dinheiro' && formData.trocoPara) {
      const trocoPara = parseFloat(formData.trocoPara)
      if (isNaN(trocoPara) || trocoPara < totalComEntrega) {
        newErrors.trocoPara = 'Valor deve ser maior que o total do pedido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const endereco = `${formData.rua}, ${formData.numero} - ${formData.bairro}${formData.complemento ? ` (${formData.complemento})` : ''}`
      
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            produto_id: parseInt(item.produto_id),
            loja_id: parseInt(item.loja_id),
            quantidade: item.quantidade,
            preco: item.preco,
          })),
          endereco,
          referencia: formData.referencia || null,
          forma_pagamento: formData.formaPagamento,
          troco_para: formData.formaPagamento === 'dinheiro' && formData.trocoPara ? parseFloat(formData.trocoPara) : null,
          observacoes: formData.observacoes || null,
          taxa_entrega: taxaEntrega,
          total: totalComEntrega,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pedido')
      }

      // Clear cart and redirect to success page
      clearCart()
      router.push(`/${tenant.slug}/pedido/${data.id}`)
    } catch (error: any) {
      alert('Erro ao finalizar pedido: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Endereço */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📍 Endereço de Entrega</h2>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label htmlFor="rua" className="block text-sm font-medium text-gray-300 mb-2">
                      Rua/Avenida *
                    </label>
                    <input
                      id="rua"
                      name="rua"
                      type="text"
                      value={formData.rua}
                      onChange={handleChange}
                      placeholder="Ex: Rua das Flores"
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.rua ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary`}
                    />
                    {errors.rua && <p className="text-red-500 text-sm mt-1">{errors.rua}</p>}
                  </div>

                  <div>
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-2">
                      Número *
                    </label>
                    <input
                      id="numero"
                      name="numero"
                      type="text"
                      value={formData.numero}
                      onChange={handleChange}
                      placeholder="123"
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.numero ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary`}
                    />
                    {errors.numero && <p className="text-red-500 text-sm mt-1">{errors.numero}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bairro" className="block text-sm font-medium text-gray-300 mb-2">
                      Bairro *
                    </label>
                    <input
                      id="bairro"
                      name="bairro"
                      type="text"
                      value={formData.bairro}
                      onChange={handleChange}
                      placeholder="Ex: Centro"
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.bairro ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary`}
                    />
                    {errors.bairro && <p className="text-red-500 text-sm mt-1">{errors.bairro}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="complemento" className="block text-sm font-medium text-gray-300 mb-2">
                      Complemento
                    </label>
                    <input
                      id="complemento"
                      name="complemento"
                      type="text"
                      value={formData.complemento}
                      onChange={handleChange}
                      placeholder="Ex: Apto 201, Bloco B"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label htmlFor="referencia" className="block text-sm font-medium text-gray-300 mb-2">
                      Ponto de Referência
                    </label>
                    <input
                      id="referencia"
                      name="referencia"
                      type="text"
                      value={formData.referencia}
                      onChange={handleChange}
                      placeholder="Ex: Próximo à Padaria Central"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">💳 Forma de Pagamento</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-300 mb-2">
                      Pagar com *
                    </label>
                    <select
                      id="formaPagamento"
                      name="formaPagamento"
                      value={formData.formaPagamento}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tenant-primary"
                    >
                      <option value="dinheiro">💵 Dinheiro</option>
                      <option value="pix">📱 PIX</option>
                      <option value="cartao">💳 Cartão (na entrega)</option>
                    </select>
                  </div>

                  {formData.formaPagamento === 'dinheiro' && (
                    <div>
                      <label htmlFor="trocoPara" className="block text-sm font-medium text-gray-300 mb-2">
                        Troco para (opcional)
                      </label>
                      <input
                        id="trocoPara"
                        name="trocoPara"
                        type="number"
                        step="0.01"
                        value={formData.trocoPara}
                        onChange={handleChange}
                        placeholder={`Mínimo: R$ ${totalComEntrega.toFixed(2)}`}
                        className={`w-full px-4 py-3 bg-gray-900 border ${errors.trocoPara ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary`}
                      />
                      {errors.trocoPara && <p className="text-red-500 text-sm mt-1">{errors.trocoPara}</p>}
                      {formData.trocoPara && !errors.trocoPara && parseFloat(formData.trocoPara) > totalComEntrega && (
                        <p className="text-green-500 text-sm mt-1">
                          Troco: R$ {(parseFloat(formData.trocoPara) - totalComEntrega).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📝 Observações</h2>
                
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Ex: sem cebola, bem passado, cuidado com o portão..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary resize-none"
                />
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-4">Resumo do Pedido</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="text-white">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-700 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Taxa de Entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold border-t border-gray-700 pt-2">
                  <span>Total</span>
                  <span className="text-tenant-primary">R$ {totalComEntrega.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 py-4 bg-tenant-primary text-tenant-secondary font-bold text-lg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Confirmar Pedido'}
              </button>

              <button
                onClick={() => router.push(`/${tenant.slug}/carrinho`)}
                className="w-full mt-3 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                Voltar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
