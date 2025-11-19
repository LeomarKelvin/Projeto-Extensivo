'use client'

import { useState, useEffect, useRef } from 'react'
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
  troco_para?: number
  observacoes: string | null
  created_at: string
  perfil: {
    nome_completo: string
    telefone: string
  }
  // Ajuste para bater com o retorno da API
  items?: Array<{
    quantidade: number
    preco_unitario: number
    observacao: string | null
    produto: {
      id: number
      nome: string
    }
  }>
  // Para quando vier do Realtime (estrutura simplificada do banco)
  pedido_itens?: any[]
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
  pendente: { label: '🔔 Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500' },
  aceito: { label: '👨‍🍳 Aceito / Preparando', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500' },
  preparando: { label: '🔥 No Fogo', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500' }, // Opcional, pode usar só Aceito
  pronto: { label: '✨ Pronto', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500' },
  em_entrega: { label: '🛵 Em Entrega', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500' },
  entregue: { label: '✅ Concluído', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
  cancelado: { label: '❌ Cancelado', color: 'text-red-500', bg: 'bg-red-900/20 border-red-900' },
}

export default function LojaPedidosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtroStatus, setFiltroStatus] = useState('ativos') // 'ativos' = Pendente, Aceito, Pronto, Entrega
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  // Áudio de notificação
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Cria o elemento de áudio uma única vez
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
  }, [])

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Interação necessária para tocar som"))
    }
  }

  // 1. Inicialização e Busca de Dados
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: loja } = await supabase
        .from('lojas')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (loja) {
        setLojaId(loja.id)
        loadPedidos(loja.id)
      } else {
        router.push('/')
      }
    }
    init()
  }, [])

  // 2. Realtime: Escutar novos pedidos
  useEffect(() => {
    if (!lojaId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('pedidos-loja')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT e UPDATE
          schema: 'public',
          table: 'pedidos',
          filter: `loja_id=eq.${lojaId}`
        },
        (payload) => {
          console.log('Alteração recebida:', payload)
          
          if (payload.eventType === 'INSERT') {
            playNotification() // TOCA O SOM!
            loadPedidos(lojaId) // Recarrega para pegar os detalhes completos (itens, cliente)
            alert('🔔 NOVO PEDIDO RECEBIDO!')
          } else if (payload.eventType === 'UPDATE') {
            // Atualiza a lista suavemente
            loadPedidos(lojaId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lojaId])

  const loadPedidos = async (id: number) => {
    setLoading(true)
    try {
      // Usamos a API interna para trazer os dados já formatados com relacionamentos
      // Em um app real de alta escala, faríamos a query direto no Supabase aqui para ser mais rápido no Realtime
      // Mas a API garante consistência com o que já fizemos
      const response = await fetch(`/api/loja/pedidos?loja_id=${id}&status=todos`) // Traz todos e filtramos no front
      const data = await response.json()
      
      if (data.pedidos) {
        setPedidos(data.pedidos)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (pedidoId: number, novoStatus: string) => {
    const supabase = createClient()
    await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', pedidoId)
    
    // O Realtime vai cuidar de atualizar a tela, mas podemos forçar para ser instantâneo visualmente
    setPedidos(current => 
      current.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p)
    )
  }

  // Filtros de Visualização
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus === 'ativos') {
      return ['pendente', 'aceito', 'preparando', 'pronto', 'em_entrega'].includes(p.status)
    }
    return p.status === filtroStatus
  })

  if (loading && pedidos.length === 0) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando pedidos...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white">←</button>
              <h1 className="text-3xl font-bold text-white">Gestão de Pedidos</h1>
            </div>
            <p className="text-gray-400 mt-1 text-sm pl-6">Acompanhamento em Tempo Real ⚡</p>
          </div>

          {/* Filtros (Abas) */}
          <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
            <button onClick={() => setFiltroStatus('ativos')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${filtroStatus === 'ativos' ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>
              Em Andamento ({pedidos.filter(p => ['pendente', 'aceito', 'preparando', 'pronto', 'em_entrega'].includes(p.status)).length})
            </button>
            <button onClick={() => setFiltroStatus('entregue')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filtroStatus === 'entregue' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
              Concluídos
            </button>
            <button onClick={() => setFiltroStatus('cancelado')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filtroStatus === 'cancelado' ? 'bg-red-900/50 text-red-200' : 'text-gray-400 hover:text-white'}`}>
              Cancelados
            </button>
          </div>
        </div>

        {/* GRID DE PEDIDOS (Estilo Comanda) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pedidosFiltrados.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
              <p className="text-gray-500 text-lg">Nenhum pedido nesta lista.</p>
            </div>
          )}

          {pedidosFiltrados.map((pedido) => {
            const config = statusConfig[pedido.status] || statusConfig['pendente']
            
            return (
              <div key={pedido.id} className={`bg-gray-800 rounded-xl border-2 overflow-hidden flex flex-col ${config.bg} transition-all hover:shadow-lg`}>
                
                {/* Cabeçalho da Comanda */}
                <div className="p-4 border-b border-gray-700/50 bg-gray-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-bold text-white">#{pedido.id}</span>
                    <span className="text-xs text-gray-400">{new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`text-sm font-bold ${config.color} uppercase tracking-wider`}>
                    {config.label}
                  </div>
                </div>

                {/* Corpo da Comanda */}
                <div className="p-4 flex-1">
                  {/* Cliente */}
                  <div className="mb-4 pb-4 border-b border-gray-700/50">
                    <p className="text-white font-bold truncate">{pedido.perfil.nome_completo}</p>
                    <p className="text-sm text-gray-400">📞 {pedido.perfil.telefone || 'Sem tel'}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{pedido.endereco_entrega}</p>
                  </div>

                  {/* Itens */}
                  <div className="space-y-3">
                    {pedido.items?.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex justify-between text-white">
                          <span className="font-bold text-primary">{item.quantidade}x</span>
                          <span className="flex-1 mx-2">{item.produto.nome}</span>
                        </div>
                        {item.observacao && (
                          <p className="text-yellow-400 text-xs mt-1 bg-yellow-400/10 p-1 rounded border border-yellow-400/20">
                            ⚠️ Obs: {item.observacao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {pedido.observacoes && (
                    <div className="mt-4 p-2 bg-gray-700/50 rounded text-xs text-gray-300 border border-gray-600">
                      <strong>Nota do Pedido:</strong> {pedido.observacoes}
                    </div>
                  )}
                </div>

                {/* Rodapé / Ações */}
                <div className="p-4 bg-gray-900/50 border-t border-gray-700/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-xl font-bold text-white">R$ {pedido.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3 text-right">
                    Pagamento: <span className="text-gray-300 capitalize">{pedido.forma_pagamento}</span>
                    {pedido.troco_para && <span className="block text-green-400">Troco p/ R$ {pedido.troco_para}</span>}
                  </div>

                  {/* Botões de Ação Dinâmicos */}
                  <div className="grid grid-cols-1 gap-2">
                    {pedido.status === 'pendente' && (
                      <>
                        <button onClick={() => handleStatusUpdate(pedido.id, 'aceito')} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg animate-pulse">
                          ACEITAR PEDIDO
                        </button>
                        <button onClick={() => handleStatusUpdate(pedido.id, 'cancelado')} className="w-full py-2 bg-gray-700 hover:bg-red-600 text-white text-sm rounded-lg">
                          Recusar
                        </button>
                      </>
                    )}

                    {pedido.status === 'aceito' && (
                      <button onClick={() => handleStatusUpdate(pedido.id, 'em_entrega')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg">
                        SAIU PARA ENTREGA 🛵
                      </button>
                    )}

                    {pedido.status === 'em_entrega' && (
                      <button onClick={() => handleStatusUpdate(pedido.id, 'entregue')} className="w-full py-3 bg-gray-600 hover:bg-green-600 text-white font-bold rounded-lg">
                        MARCAR ENTREGUE ✅
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}