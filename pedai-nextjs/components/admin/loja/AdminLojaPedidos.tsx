'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

interface AdminLojaPedidosProps {
  lojaId: string
}

export default function AdminLojaPedidos({ lojaId }: AdminLojaPedidosProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loja, setLoja] = useState<any>(null)
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndLoadPedidos()
  }, [filtroStatus, lojaId])

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

    if (!perfil || perfil.tipo !== 'admin') {
      router.push('/')
      return
    }

    await loadPedidos()
  }

  const loadPedidos = async () => {
    setLoading(true)
    try {
      const url = filtroStatus === 'todos' 
        ? `/api/loja/pedidos?loja_id=${lojaId}`
        : `/api/loja/pedidos?status=${filtroStatus}&loja_id=${lojaId}`
      
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

  const updateStatus = async (pedidoId: number, newStatus: string) => {
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
        console.error('Erro ao atualizar status:', data.error)
        alert('Erro ao atualizar status do pedido')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusActions = (pedido: Pedido) => {
    const actions = []
    
    if (pedido.status === 'pendente') {
      actions.push(
        <button
          key="aceitar"
          onClick={() => updateStatus(pedido.id, 'aceito')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={updating === pedido.id}
        >
          Aceitar Pedido
        </button>,
        <button
          key="cancelar"
          onClick={() => updateStatus(pedido.id, 'cancelado')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          disabled={updating === pedido.id}
        >
          Cancelar
        </button>
      )
    } else if (pedido.status === 'aceito') {
      actions.push(
        <button
          key="preparando"
          onClick={() => updateStatus(pedido.id, 'preparando')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          disabled={updating === pedido.id}
        >
          Iniciar Preparo
        </button>
      )
    } else if (pedido.status === 'preparando') {
      actions.push(
        <button
          key="pronto"
          onClick={() => updateStatus(pedido.id, 'pronto')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={updating === pedido.id}
        >
          Marcar como Pronto
        </button>
      )
    } else if (pedido.status === 'pronto') {
      actions.push(
        <button
          key="em_entrega"
          onClick={() => updateStatus(pedido.id, 'em_entrega')}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
          disabled={updating === pedido.id}
        >
          Saiu para Entrega
        </button>
      )
    } else if (pedido.status === 'em_entrega') {
      actions.push(
        <button
          key="entregue"
          onClick={() => updateStatus(pedido.id, 'entregue')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          disabled={updating === pedido.id}
        >
          Marcar como Entregue
        </button>
      )
    }
    
    return actions
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/admin/loja/${lojaId}/dashboard`} className="text-blue-600 hover:text-blue-800">
              ← Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600">{loja?.nome_loja} (Admin)</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFiltroStatus(value)}
              className={`px-4 py-2 rounded-md font-medium transition ${
                filtroStatus === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de Pedidos */}
        {pedidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Pedido #{pedido.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(pedido.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${statusColors[pedido.status]}`}>
                        {statusLabels[pedido.status]}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        R$ {pedido.total.toFixed(2)}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedPedido === pedido.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedPedido === pedido.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Cliente</h4>
                        <p className="text-gray-700">{pedido.perfil?.nome_completo || 'Cliente Guest'}</p>
                        <p className="text-gray-600">{pedido.perfil?.telefone || 'Sem telefone'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Endereço de Entrega</h4>
                        <p className="text-gray-700">{pedido.endereco_entrega}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h4>
                      <div className="space-y-2">
                        {pedido.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-3 rounded">
                            <div>
                              <p className="font-medium text-gray-900">{item.produto.nome}</p>
                              <p className="text-sm text-gray-600">Quantidade: {item.quantidade}</p>
                              {item.observacao && (
                                <p className="text-sm text-gray-500 italic">Obs: {item.observacao}</p>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900">
                              R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">R$ {pedido.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Taxa de Entrega:</span>
                        <span className="text-gray-900">R$ {pedido.taxa_entrega.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>R$ {pedido.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">Forma de Pagamento:</span>
                        <span className="text-gray-900 capitalize">{pedido.forma_pagamento}</span>
                      </div>
                    </div>

                    {pedido.observacoes && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                        <p className="text-gray-700 bg-white p-3 rounded">{pedido.observacoes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {getStatusActions(pedido)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
