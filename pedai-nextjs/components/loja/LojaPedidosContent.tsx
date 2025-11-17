'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Pedido {
  id: number
  status: string
  total: number
  subtotal: number
  taxa_entrega: number
  endereco_entrega: string
  forma_pagamento: string
  observacoes: string | null
  created_at: string
  perfil: {
    nome_completo: string
    telefone: string
  }
  items: Array<{
    quantidade: number
    preco_unitario: number
    observacao: string | null
    produto: {
      id: number
      nome: string
    }
  }>
}

const statusLabels: Record<string, string> = {
  todos: 'Todos',
  pendente: 'Pendente',
  aceito: 'Aceito',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_entrega: 'Em Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500',
  aceito: 'bg-blue-500',
  preparando: 'bg-purple-500',
  pronto: 'bg-green-500',
  em_entrega: 'bg-cyan-500',
  entregue: 'bg-gray-500',
  cancelado: 'bg-red-500',
}

export default function LojaPedidosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loja, setLoja] = useState<any>(null)
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndLoadPedidos()
  }, [filtroStatus])

  const checkAuthAndLoadPedidos = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('user_id', user.id)
      .single()

    if (!perfil || perfil.tipo !== 'loja') {
      router.push('/')
      return
    }

    await loadPedidos()
  }

  const loadPedidos = async () => {
    setLoading(true)
    try {
      const url = filtroStatus === 'todos' 
        ? '/api/loja/pedidos'
        : `/api/loja/pedidos?status=${filtroStatus}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setPedidos(data.pedidos || [])
        setLoja(data.loja)
      } else {
        console.error('Erro ao carregar pedidos:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (pedidoId: number, newStatus: string) => {
    setUpdating(pedidoId)
    try {
      const response = await fetch(`/api/loja/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await loadPedidos()
      } else {
        const data = await response.json()
        alert('Erro ao atualizar status: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setUpdating(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pedidos</h1>
          <p className="text-gray-400">{loja?.nome_loja}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFiltroStatus(value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroStatus === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-gray-800 rounded-xl overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">Pedido #{pedido.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[pedido.status]}`}>
                          {statusLabels[pedido.status]}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{formatDate(pedido.created_at)}</p>
                      <p className="text-gray-300 font-medium mt-1">{pedido.perfil.nome_completo}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{formatCurrency(pedido.total)}</p>
                      <p className="text-gray-400 text-sm">{pedido.items.length} {pedido.items.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                </div>

                {expandedPedido === pedido.id && (
                  <div className="border-t border-gray-700 p-6 bg-gray-850">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-white font-bold mb-3">📦 Itens do Pedido</h4>
                        <div className="space-y-2">
                          {pedido.items.map((item, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{item.quantidade}x {item.produto.nome}</p>
                                  {item.observacao && (
                                    <p className="text-gray-400 text-sm mt-1">Obs: {item.observacao}</p>
                                  )}
                                </div>
                                <p className="text-white font-bold ml-4">{formatCurrency(item.preco_unitario * item.quantidade)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 space-y-1 text-sm">
                          <div className="flex justify-between text-gray-400">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(pedido.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Taxa de entrega:</span>
                            <span>{formatCurrency(pedido.taxa_entrega)}</span>
                          </div>
                          <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-gray-700">
                            <span>Total:</span>
                            <span>{formatCurrency(pedido.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-bold mb-3">📍 Informações de Entrega</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-gray-400">Cliente:</p>
                            <p className="text-white">{pedido.perfil.nome_completo}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Telefone:</p>
                            <p className="text-white">{pedido.perfil.telefone || 'Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Endereço:</p>
                            <p className="text-white">{pedido.endereco_entrega}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Forma de pagamento:</p>
                            <p className="text-white capitalize">{pedido.forma_pagamento}</p>
                          </div>
                          {pedido.observacoes && (
                            <div>
                              <p className="text-gray-400">Observações:</p>
                              <p className="text-white">{pedido.observacoes}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-6">
                          <h4 className="text-white font-bold mb-3">🔄 Atualizar Status</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {pedido.status === 'pendente' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(pedido.id, 'aceito')}
                                  disabled={updating === pedido.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                  ✅ Aceitar
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(pedido.id, 'cancelado')}
                                  disabled={updating === pedido.id}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                  ❌ Cancelar
                                </button>
                              </>
                            )}
                            {pedido.status === 'aceito' && (
                              <button
                                onClick={() => handleUpdateStatus(pedido.id, 'preparando')}
                                disabled={updating === pedido.id}
                                className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                              >
                                👨‍🍳 Iniciar Preparo
                              </button>
                            )}
                            {pedido.status === 'preparando' && (
                              <button
                                onClick={() => handleUpdateStatus(pedido.id, 'pronto')}
                                disabled={updating === pedido.id}
                                className="col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                              >
                                ✨ Marcar como Pronto
                              </button>
                            )}
                            {pedido.status === 'pronto' && (
                              <button
                                onClick={() => handleUpdateStatus(pedido.id, 'em_entrega')}
                                disabled={updating === pedido.id}
                                className="col-span-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                              >
                                🚚 Saiu para Entrega
                              </button>
                            )}
                            {pedido.status === 'em_entrega' && (
                              <button
                                onClick={() => handleUpdateStatus(pedido.id, 'entregue')}
                                disabled={updating === pedido.id}
                                className="col-span-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                              >
                                🎉 Marcar como Entregue
                              </button>
                            )}
                            {(pedido.status === 'entregue' || pedido.status === 'cancelado') && (
                              <p className="col-span-2 text-center text-gray-400 py-2">
                                Pedido finalizado
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => router.push('/loja/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
