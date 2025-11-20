'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LojaPDVModal from './LojaPDVModal'

// --- INTERFACES ---
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
  tipo_entrega: 'delivery' | 'retirada'
  // Cliente pode vir como objeto ou array do Supabase
  cliente_nome?: string
  cliente_telefone?: string
  perfil?: {
    nome_completo: string
    telefone: string
  } | any
  items?: Array<{
    quantidade: number
    preco_unitario: number
    observacao: string | null
    produto?: {
      id: number
      nome: string
    }
  }>
}

const statusConfig: Record<string, { label: string, color: string, bg: string, border: string }> = {
  pendente: { label: 'Novo', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500' },
  aceito: { label: 'Processando', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500' },
  preparando: { label: 'Processando', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500' },
  pronto: { label: 'Pronto / Aguardando', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-500' },
  em_entrega: { label: 'Em Trânsito', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-500' },
  entregue: { label: 'Concluído', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600' },
  cancelado: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-900' },
}

export default function LojaPedidosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [lojaId, setLojaId] = useState<number | null>(null)
  const [storeName, setStoreName] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'historico'>('kanban')
  
  // Filtros e Busca
  const [filterType, setFilterType] = useState<'todos' | 'delivery' | 'retirada'>('todos')
  const [searchId, setSearchId] = useState('')
  const [searchClient, setSearchClient] = useState('')
  const [autoAccept, setAutoAccept] = useState(false)

  // Modais
  const [showPDV, setShowPDV] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)

  const audioUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'

  const triggerAlert = async () => {
    try {
      const audio = new Audio(audioUrl)
      await audio.play()
    } catch (e) {}
    
    document.title = "🔔 NOVO PEDIDO! - PedeAí"
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('NOVO PEDIDO! 📦', { body: 'Verifique o painel agora.', requireInteraction: true })
    }
  }

  const sendToWhatsApp = (p: Pedido) => {
    const perfilData = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
    const clienteNome = p.cliente_nome || perfilData?.nome_completo || 'Cliente'
    
    const itensTexto = p.items?.map(i => `${i.quantidade}x ${i.produto?.nome || 'Item'}`).join(', ') || 'Itens não listados'
    
    const text = `📦 *PEDIDO #${p.id} - ${storeName}*\n\n` +
                 `👤 *Cliente:* ${clienteNome}\n` +
                 `📍 *Endereço:* ${p.endereco_entrega}\n` +
                 `📝 *Itens:* ${itensTexto}\n` +
                 `💰 *Total:* R$ ${p.total.toFixed(2)}\n` +
                 `💳 *Pagamento:* ${p.forma_pagamento}`
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: loja } = await supabase
        .from('lojas')
        .select('id, nome_loja, aceite_automatico')
        .eq('user_id', user.id)
        .single()

      if (loja) {
        setLojaId(loja.id)
        setStoreName(loja.nome_loja)
        setAutoAccept(loja.aceite_automatico || false)
        loadPedidos(loja.id)
      } else {
        router.push('/')
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!lojaId) return
    const supabase = createClient()
    const channel = supabase
      .channel('pedidos-loja')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${lojaId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            triggerAlert()
            if (autoAccept) {
              await supabase.from('pedidos').update({ status: 'aceito' }).eq('id', payload.new.id)
            }
          }
          loadPedidos(lojaId)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [lojaId, autoAccept])

  const toggleAutoAccept = async () => {
    if (!lojaId) return
    const novoStatus = !autoAccept
    setAutoAccept(novoStatus)
    const supabase = createClient()
    await supabase.from('lojas').update({ aceite_automatico: novoStatus }).eq('id', lojaId)
  }

  const loadPedidos = async (id: number) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *, 
          perfil:perfis(nome_completo, telefone), 
          items:pedido_itens(quantidade, preco_unitario, observacao, produto:produtos(nome))
        `)
        .eq('loja_id', id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const pedidosFormatados = data.map((p: any) => ({
          ...p,
          perfil: Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
        }))
        setPedidos(pedidosFormatados)
      }
      document.title = "Gestão de Pedidos - PedeAí"
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    const supabase = createClient()
    await supabase.from('pedidos').update({ status }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    
    if (selectedPedido?.id === id) {
      setSelectedPedido(prev => prev ? { ...prev, status } : null)
    }
  }

  const finalizeAll = async () => {
    if (colunas.transito.length === 0) return
    if (!confirm(`Finalizar todos os ${colunas.transito.length} pedidos da coluna 'Em Trânsito'?`)) return

    const supabase = createClient()
    const ids = colunas.transito.map(p => p.id)
    await supabase.from('pedidos').update({ status: 'entregue' }).in('id', ids)
    setPedidos(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'entregue' } : p))
  }

  const filteredPedidos = pedidos.filter(p => {
    if (filterType === 'delivery' && p.tipo_entrega === 'retirada') return false
    if (filterType === 'retirada' && p.tipo_entrega !== 'retirada') return false
    if (searchId && !p.id.toString().includes(searchId)) return false
    
    const perfilData = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
    const nomeBusca = p.cliente_nome || perfilData?.nome_completo || 'Cliente'
    
    if (searchClient && !nomeBusca.toLowerCase().includes(searchClient.toLowerCase())) return false
    
    return true
  })

  const colunas = {
    pendente: filteredPedidos.filter(p => p.status === 'pendente'),
    processando: filteredPedidos.filter(p => ['aceito', 'preparando'].includes(p.status)),
    transito: filteredPedidos.filter(p => ['pronto', 'em_entrega'].includes(p.status)),
  }

  const historico = pedidos.filter(p => ['entregue', 'cancelado'].includes(p.status))

  const PedidoCard = ({ p }: { p: Pedido }) => {
    const config = statusConfig[p.status] || statusConfig['pendente']
    const perfilData = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
    const clienteNome = p.cliente_nome || perfilData?.nome_completo || 'Cliente Balcão'

    return (
      <div className={`bg-gray-800 rounded-xl border-l-4 ${config.border} p-4 mb-3 shadow-lg transition-all hover:bg-gray-750 relative group`}>
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold text-white text-lg">#{p.id}</span>
          <span className="text-xs text-gray-400 font-mono">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>

        <div className="mb-3 pb-3 border-b border-gray-700 cursor-pointer" onClick={() => setSelectedPedido(p)}>
          <p className="text-sm font-bold text-gray-200 truncate hover:text-yellow-400 transition-colors">
            {clienteNome} ↗
          </p>
          <p className="text-xs text-gray-500 truncate">{p.endereco_entrega}</p>
        </div>

        <div className="space-y-1 mb-3">
          {p.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300"><span className="text-yellow-500 font-bold">{item.quantidade}x</span> {item.produto?.nome || 'Item'}</span>
            </div>
          ))}
          {p.observacoes && <p className="text-yellow-500 text-xs mt-2 bg-yellow-900/20 p-1 rounded">⚠️ {p.observacoes}</p>}
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 capitalize">{p.forma_pagamento}</span>
            {p.troco_para && <span className="text-xs text-green-400">Troco p/ {p.troco_para}</span>}
          </div>
          <span className="font-bold text-green-400 text-lg">R$ {p.total.toFixed(2)}</span>
        </div>

        <div className="grid gap-2">
          {['pronto', 'em_entrega'].includes(p.status) && (
             <button onClick={() => sendToWhatsApp(p)} className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 mb-1">
               <span>📲</span> Enviar no Zap
             </button>
          )}

          {p.status === 'pendente' && (
            <div className="flex gap-2">
              <button onClick={() => updateStatus(p.id, 'aceito')} className="flex-1 bg-yellow-500 text-gray-900 text-xs font-bold py-2 rounded hover:opacity-90 animate-pulse">ACEITAR</button>
              <button onClick={() => updateStatus(p.id, 'cancelado')} className="px-3 bg-gray-700 text-red-400 text-xs font-bold py-2 rounded hover:bg-gray-600">✕</button>
            </div>
          )}
          
          {p.status === 'aceito' && (
            <button onClick={() => updateStatus(p.id, 'pronto')} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded">
              PRONTO / SEPARADO ✅
            </button>
          )}

          {p.status === 'pronto' && (
             <button onClick={() => updateStatus(p.id, 'em_entrega')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded">
               SAIU PARA ENTREGA 🛵
             </button>
          )}

          {p.status === 'em_entrega' && (
             <button onClick={() => updateStatus(p.id, 'entregue')} className="w-full bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 rounded border border-gray-500">
               MARCAR COMO ENTREGUE 🏁
             </button>
          )}
          
          {/* BOTÃO VER DETALHES */}
          <button 
            onClick={() => setSelectedPedido(p)} 
            className="w-full text-sm font-bold text-yellow-500 hover:text-yellow-400 underline mt-2"
          >
            Ver detalhes completos ↗
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="text-white p-8 text-center bg-gray-900 min-h-screen">Carregando Sistema...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 overflow-hidden flex flex-col">
      
      {/* --- TOP BAR --- */}
      <div className="flex flex-col gap-4 mb-6 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <h1 className="text-2xl font-bold text-white">Gestão de Pedidos</h1>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPDV(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>+</span> Novo Pedido
            </button>
            <button onClick={() => router.push('/loja/configuracoes')} className="bg-gray-700 text-gray-300 p-2 rounded-md hover:bg-gray-600" title="Configurações">⚙️</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button onClick={() => setFilterType('todos')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${filterType === 'todos' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Todos</button>
            <button onClick={() => setFilterType('delivery')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${filterType === 'delivery' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>🛵 Delivery</button>
            <button onClick={() => setFilterType('retirada')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${filterType === 'retirada' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>🏪 Retirada</button>
          </div>

          <div className="flex gap-2 w-full md:w-auto flex-1 max-w-2xl justify-end">
            <input placeholder="Nº Pedido" className="w-24 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-sm text-white outline-none focus:border-yellow-500 placeholder-gray-500" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
            <input placeholder="Buscar pelo cliente..." className="flex-1 md:flex-none md:w-64 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-sm text-white outline-none focus:border-yellow-500 placeholder-gray-500" value={searchClient} onChange={(e) => setSearchClient(e.target.value)} />
            <button onClick={() => setViewMode(viewMode === 'kanban' ? 'historico' : 'kanban')} className="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 border border-gray-600">
              {viewMode === 'kanban' ? 'Histórico' : 'Kanban'}
            </button>
          </div>
        </div>
      </div>

      {/* --- KANBAN --- */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-gray-700 bg-gray-800/90 flex flex-col gap-2 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-yellow-400 flex items-center gap-2">🔔 Novos <span className="text-xs bg-yellow-400/20 px-2 rounded">{colunas.pendente.length}</span></h2>
              </div>
              <div className="bg-gray-700/50 p-2 rounded-md border border-gray-600 flex items-center justify-between">
                <div><span className="text-xs font-bold text-white block">Aceitar automaticamente</span><span className="text-[10px] text-gray-400">Balcão: 0 min • Delivery: 30-45 min</span></div>
                <button onClick={toggleAutoAccept} className={`w-10 h-5 rounded-full p-1 transition-colors ${autoAccept ? 'bg-yellow-500' : 'bg-gray-500'}`}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${autoAccept ? 'translate-x-5' : 'translate-x-0'}`} /></button>
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-2">{colunas.pendente.map(p => <PedidoCard key={p.id} p={p} />)}</div>
          </div>

          <div className="bg-gray-800/30 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-gray-700 bg-orange-900/40 flex justify-between items-center sticky top-0 z-10"><h2 className="font-bold text-orange-400 flex items-center gap-2">⚙️ Processando <span className="text-xs bg-orange-900 text-orange-200 text-xs px-2 py-0.5 rounded-full">{colunas.processando.length}</span></h2></div>
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-2 bg-orange-900/10">{colunas.processando.map(p => <PedidoCard key={p.id} p={p} />)}</div>
          </div>

          <div className="bg-gray-800/30 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-gray-700 bg-green-900/40 flex justify-between items-center sticky top-0 z-10">
              <h2 className="font-bold text-green-400 flex items-center gap-2">Prontos <span className="bg-green-900 text-green-200 text-xs px-2 py-0.5 rounded-full">{colunas.transito.length}</span></h2>
              {colunas.transito.length > 0 && <button onClick={finalizeAll} className="text-[10px] bg-green-700 text-white px-2 py-1 rounded hover:bg-green-600 transition font-bold">Finalizar Todos</button>}
            </div>
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-2 bg-green-900/10">{colunas.transito.map(p => <PedidoCard key={p.id} p={p} />)}</div>
          </div>
        </div>
      )}

      {/* --- HISTÓRICO --- */}
      {viewMode === 'historico' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-700 text-gray-200 uppercase font-medium sticky top-0">
              <tr><th className="p-4">#</th><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Total</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {historico.map(p => {
                 const perfilData = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
                 const clienteNome = p.cliente_nome || perfilData?.nome_completo || 'Cliente'
                 return (
                  <tr key={p.id} className="hover:bg-gray-700/50 transition">
                    <td className="p-4 font-bold">#{p.id}</td>
                    <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-4">{clienteNome}</td>
                    <td className="p-4 text-white">R$ {p.total.toFixed(2)}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'entregue' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>{p.status === 'entregue' ? 'CONCLUÍDO' : 'CANCELADO'}</span></td>
                  </tr>
                 )
              })}
            </tbody>
          </table>
          {historico.length === 0 && <div className="p-8 text-center">Histórico vazio.</div>}
        </div>
      )}

      {/* --- MODAL DE DETALHES --- */}
      {selectedPedido && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && setSelectedPedido(null)}
        >
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col max-h-[90vh] relative">
            
            {/* HEADER DO MODAL */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
              <div>
                <h2 className="text-2xl font-bold text-white">Pedido #{selectedPedido.id}</h2>
                <p className="text-sm text-gray-400">{new Date(selectedPedido.created_at).toLocaleString()}</p>
              </div>
              {/* BOTÃO DE FECHAR (X) GRANDE */}
              <button 
                onClick={() => setSelectedPedido(null)} 
                className="text-white bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-110"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">👤 Cliente</h3>
                    <p className="text-white font-bold text-lg mb-1">{selectedPedido.cliente_nome || (Array.isArray(selectedPedido.perfil) ? selectedPedido.perfil[0]?.nome_completo : selectedPedido.perfil?.nome_completo) || 'Cliente Balcão'}</p>
                    <p className="text-gray-400 text-sm">📞 {selectedPedido.cliente_telefone || (Array.isArray(selectedPedido.perfil) ? selectedPedido.perfil[0]?.telefone : selectedPedido.perfil?.telefone) || 'Sem telefone'}</p>
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">📍 Entrega</h3>
                    <p className="text-white text-sm leading-relaxed">{selectedPedido.endereco_entrega}</p>
                    <div className="mt-3 inline-block bg-gray-800 px-3 py-1 rounded text-xs text-gray-400 border border-gray-600">
                      {selectedPedido.tipo_entrega === 'retirada' ? '🏪 Retirada na Loja' : '🛵 Delivery'}
                    </div>
                  </div>
                   <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">💰 Pagamento</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-white capitalize">{selectedPedido.forma_pagamento}</span>
                      {selectedPedido.troco_para && (
                        <span className="text-green-400 text-sm">Troco p/ R$ {selectedPedido.troco_para}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">📝 Itens</h3>
                    <div className="space-y-3">
                      {selectedPedido.items?.map((item, idx) => (
                        <div key={idx} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-start">
                          <div>
                             <p className="text-white font-medium"><span className="text-yellow-500">{item.quantidade}x</span> {item.produto?.nome}</p>
                             {item.observacao && <p className="text-yellow-500 text-xs mt-1">Obs: {item.observacao}</p>}
                          </div>
                          <span className="text-gray-400 text-sm font-bold">R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedPedido.observacoes && (
                     <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-700/50">
                       <h3 className="text-yellow-500 font-bold mb-1 text-xs uppercase">⚠️ Nota do Pedido</h3>
                       <p className="text-gray-300 text-sm">{selectedPedido.observacoes}</p>
                     </div>
                  )}
                  <div className="border-t border-gray-700 pt-4 space-y-2">
                     <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R$ {selectedPedido.subtotal.toFixed(2)}</span></div>
                     <div className="flex justify-between text-sm text-gray-400"><span>Taxa de Entrega</span><span>R$ {selectedPedido.taxa_entrega.toFixed(2)}</span></div>
                     <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700"><span>Total</span><span>R$ {selectedPedido.total.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
               {selectedPedido.status === 'pendente' && (
                 <>
                   <button onClick={() => { updateStatus(selectedPedido.id, 'cancelado'); setSelectedPedido(null) }} className="px-6 py-3 rounded-lg bg-red-900/50 text-red-400 font-bold hover:bg-red-900 transition">Recusar</button>
                   <button onClick={() => { updateStatus(selectedPedido.id, 'aceito'); setSelectedPedido(null) }} className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition shadow-lg shadow-green-900/20">ACEITAR PEDIDO</button>
                 </>
               )}
               {['pronto', 'em_entrega'].includes(selectedPedido.status) && (
                 <button onClick={() => sendToWhatsApp(selectedPedido)} className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition">Enviar no WhatsApp</button>
               )}
               <button onClick={() => setSelectedPedido(null)} className="px-6 py-3 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition border border-gray-600">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PDV (Novo Pedido) --- */}
      {showPDV && lojaId && (
        <LojaPDVModal 
          lojaId={lojaId} 
          onClose={() => setShowPDV(false)} 
          onSuccess={() => {
            setShowPDV(false)
            loadPedidos(lojaId)
          }} 
        />
      )}

    </div>
  )
}