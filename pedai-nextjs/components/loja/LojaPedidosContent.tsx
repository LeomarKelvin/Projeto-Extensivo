'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ... (Interfaces e statusConfig mantidos iguais, vou encurtar para caber)
// Mantenha as interfaces Pedido e statusConfig do código anterior aqui...
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
  items?: Array<{
    quantidade: number
    preco_unitario: number
    observacao: string | null
    produto: {
      id: number
      nome: string
    }
  }>
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
  pendente: { label: '🔔 Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500' },
  aceito: { label: '👨‍🍳 Aceito / Preparando', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500' },
  preparando: { label: '🔥 No Fogo', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500' },
  pronto: { label: '✨ Pronto', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500' },
  em_entrega: { label: '🛵 Em Entrega', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500' },
  entregue: { label: '✅ Concluído', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
  cancelado: { label: '❌ Cancelado', color: 'text-red-500', bg: 'bg-red-900/20 border-red-900' },
}

export default function LojaPedidosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtroStatus, setFiltroStatus] = useState('ativos')
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  const audioUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'

  const triggerAlert = async () => {
    try {
      const audio = new Audio(audioUrl)
      await audio.play()
    } catch (e) {
      console.error("Erro som:", e)
    }
    document.title = "🔔 (1) NOVO PEDIDO! - PedeAí"

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          alert('⚠️ Habilite as notificações no navegador.')
          return
        }
      }
      new Notification('NOVO PEDIDO RECEBIDO! 🍕', {
        body: 'Um cliente acabou de fazer um pedido. Clique para ver.',
        requireInteraction: true
      })
    }
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Busca robusta da loja
      const { data: loja, error } = await supabase
        .from('lojas')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error || !loja) {
        console.error("Erro ao buscar loja:", error)
        alert("Erro: Loja não encontrada para este usuário.")
        return
      }

      console.log("Loja encontrada ID:", loja.id)
      setLojaId(loja.id)
      loadPedidos(loja.id)
    }
    init()
  }, [])

  // REALTIME
  useEffect(() => {
    if (!lojaId) return

    const supabase = createClient()
    const channel = supabase
      .channel('pedidos-loja')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'pedidos',
          filter: `loja_id=eq.${lojaId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            triggerAlert()
            loadPedidos(lojaId)
          } else if (payload.eventType === 'UPDATE') {
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
      // MUDANÇA AQUI: Buscando direto do Supabase para evitar cache da API
      const supabase = createClient()
      const { data: pedidosData, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          perfil:perfis(nome_completo, telefone),
          items:pedido_itens(
            quantidade,
            preco_unitario,
            observacao,
            produto:produtos(id, nome)
          )
        `)
        .eq('loja_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log("Pedidos carregados:", pedidosData?.length)
      if (pedidosData) setPedidos(pedidosData as any) // Cast rápido para evitar erro de tipo complexo
      
      document.title = "Gestão de Pedidos - PedeAí"
      
    } catch (error) {
      console.error('Erro ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (pedidoId: number, novoStatus: string) => {
    document.title = "Gestão de Pedidos - PedeAí"

    const supabase = createClient()
    await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', pedidoId)
    
    setPedidos(current => 
      current.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p)
    )
  }

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
            <p className="text-gray-400 mt-1 text-sm pl-6">
              Painel em Tempo Real ⚡ (Loja ID: {lojaId})
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button 
              onClick={triggerAlert}
              className="px-4 py-2 bg-gray-700 text-yellow-400 rounded-md font-bold text-sm hover:bg-gray-600 border border-yellow-400/30 flex items-center gap-2"
            >
              🔔 Ativar Alertas
            </button>

            <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pedidosFiltrados.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
              <p className="text-gray-500 text-lg">Nenhum pedido encontrado.</p>
              <p className="text-gray-600 text-sm mt-2">Aguardando novos pedidos...</p>
            </div>
          )}

          {pedidosFiltrados.map((pedido) => {
            const config = statusConfig[pedido.status] || statusConfig['pendente']
            
            return (
              <div key={pedido.id} className={`bg-gray-800 rounded-xl border-2 overflow-hidden flex flex-col ${config.bg} transition-all hover:shadow-lg animate-fadeIn`}>
                
                <div className="p-4 border-b border-gray-700/50 bg-gray-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-bold text-white">#{pedido.id}</span>
                    <span className="text-xs text-gray-400">{new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`text-sm font-bold ${config.color} uppercase tracking-wider`}>
                    {config.label}
                  </div>
                </div>

                <div className="p-4 flex-1">
                  <div className="mb-4 pb-4 border-b border-gray-700/50">
                    <p className="text-white font-bold truncate">{pedido.perfil?.nome_completo || 'Cliente'}</p>
                    <p className="text-sm text-gray-400">📞 {pedido.perfil?.telefone || 'Sem tel'}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{pedido.endereco_entrega}</p>
                  </div>

                  <div className="space-y-3">
                    {pedido.items?.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex justify-between text-white">
                          <span className="font-bold text-primary">{item.quantidade}x</span>
                          <span className="flex-1 mx-2">{item.produto?.nome || 'Item removido'}</span>
                        </div>
                        {item.observacao && (
                          <p className="text-yellow-400 text-xs mt-1 bg-yellow-400/10 p-1 rounded border border-yellow-400/20">
                            ⚠️ {item.observacao}
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

                <div className="p-4 bg-gray-900/50 border-t border-gray-700/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-xl font-bold text-white">R$ {pedido.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3 text-right">
                    Pagamento: <span className="text-gray-300 capitalize">{pedido.forma_pagamento}</span>
                    {pedido.troco_para && <span className="block text-green-400">Troco p/ R$ {pedido.troco_para}</span>}
                  </div>

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