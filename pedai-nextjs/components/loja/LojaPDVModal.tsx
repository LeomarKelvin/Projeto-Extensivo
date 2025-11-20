'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Produto {
  id: number
  nome: string
  preco: number
  categoria: string
  disponivel: boolean
}

interface CarrinhoItem {
  produto: Produto
  quantidade: number
  observacao: string
}

interface LojaPDVModalProps {
  lojaId: number
  onClose: () => void
  onSuccess: () => void
}

export default function LojaPDVModal({ lojaId, onClose, onSuccess }: LojaPDVModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')

  // Dados do Pedido
  const [tipoEntrega, setTipoEntrega] = useState<'delivery' | 'retirada'>('retirada')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState('dinheiro')
  const [troco, setTroco] = useState('')
  const [taxaEntrega, setTaxaEntrega] = useState(0)

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Carregar Produtos e Configs da Loja
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Produtos
      const { data: prods } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('disponivel', true)
        .order('nome')
      
      if (prods) setProdutos(prods)

      // Config da Loja (Taxa Padrão)
      const { data: loja } = await supabase
        .from('lojas')
        .select('taxa_entrega')
        .eq('id', lojaId)
        .single()
      
      if (loja?.taxa_entrega) setTaxaEntrega(loja.taxa_entrega)
      
      setLoading(false)
    }
    loadData()
  }, [lojaId])

  // Carrinho
  const addItem = (produto: Produto) => {
    setCarrinho(prev => {
      const existe = prev.find(item => item.produto.id === produto.id)
      if (existe) {
        return prev.map(item => 
          item.produto.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 } 
            : item
        )
      }
      return [...prev, { produto, quantidade: 1, observacao: '' }]
    })
  }

  const removeItem = (index: number) => {
    setCarrinho(prev => prev.filter((_, i) => i !== index))
  }

  const updateQtd = (index: number, delta: number) => {
    setCarrinho(prev => prev.map((item, i) => {
      if (i === index) {
        const novaQtd = Math.max(1, item.quantidade + delta)
        return { ...item, quantidade: novaQtd }
      }
      return item
    }))
  }

  // Totais
  const subtotal = carrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0)
  const total = subtotal + (tipoEntrega === 'delivery' ? taxaEntrega : 0)

  // Finalizar
  const handleSubmit = async () => {
    if (carrinho.length === 0) return alert('Adicione produtos ao pedido.')
    if (!clienteNome) return alert('Informe o nome do cliente.')
    if (tipoEntrega === 'delivery' && !endereco) return alert('Informe o endereço de entrega.')

    setSaving(true)
    const supabase = createClient()

    try {
      // 1. Criar Pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          loja_id: lojaId,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          tipo_entrega: tipoEntrega,
          endereco_entrega: tipoEntrega === 'retirada' ? 'Retirada no Balcão' : endereco,
          forma_pagamento: pagamento,
          troco_para: troco ? parseFloat(troco) : null,
          subtotal: subtotal,
          taxa_entrega: tipoEntrega === 'delivery' ? taxaEntrega : 0,
          total: total,
          status: 'aceito', // Já entra como aceito/produção
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (pedidoError) throw pedidoError

      // 2. Criar Itens
      const itensPayload = carrinho.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        observacao: item.observacao || null
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensPayload)

      if (itensError) throw itensError

      // Sucesso
      onSuccess()
      onClose()

    } catch (error: any) {
      alert('Erro ao lançar pedido: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Filtros
  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroCategoria === 'Todos' || p.categoria === filtroCategoria)
  )
  const categorias = ['Todos', ...Array.from(new Set(produtos.map(p => p.categoria || 'Outros')))]

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl border border-gray-700 shadow-2xl flex overflow-hidden relative">
        
        {/* COLUNA ESQUERDA: PRODUTOS */}
        <div className="flex-1 flex flex-col border-r border-gray-700 bg-gray-800/50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📦 Novo Pedido (PDV)
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              >
                ✕ Esc
              </button>
            </div>
            
            <input 
              autoFocus
              placeholder="🔍 Buscar produto (Nome)..." 
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-primary outline-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {categorias.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${filtroCategoria === cat ? 'bg-primary text-secondary' : 'bg-gray-700 text-gray-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
            {produtosFiltrados.map(prod => (
              <button 
                key={prod.id}
                onClick={() => addItem(prod)}
                className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-primary hover:bg-gray-750 transition text-left group"
              >
                <div className="font-bold text-white group-hover:text-primary truncate">{prod.nome}</div>
                <div className="text-green-400 font-bold mt-1">R$ {prod.preco.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* COLUNA DIREITA: DADOS E CARRINHO */}
        <div className="w-[400px] flex flex-col bg-gray-900">
          <div className="p-4 border-b border-gray-800 bg-gray-850">
            <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-lg">
              <button onClick={() => setTipoEntrega('retirada')} className={`flex-1 py-2 rounded font-bold text-sm ${tipoEntrega === 'retirada' ? 'bg-primary text-secondary' : 'text-gray-400'}`}>🏪 Balcão</button>
              <button onClick={() => setTipoEntrega('delivery')} className={`flex-1 py-2 rounded font-bold text-sm ${tipoEntrega === 'delivery' ? 'bg-primary text-secondary' : 'text-gray-400'}`}>🛵 Delivery</button>
            </div>

            <div className="space-y-3">
              <input 
                placeholder="Nome do Cliente *" 
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-primary outline-none"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
              />
              {tipoEntrega === 'delivery' && (
                <>
                  <input 
                    placeholder="Telefone / WhatsApp" 
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-primary outline-none"
                    value={clienteTelefone}
                    onChange={e => setClienteTelefone(e.target.value)}
                  />
                  <textarea 
                    placeholder="Endereço de Entrega completo..." 
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-primary outline-none resize-none h-16"
                    value={endereco}
                    onChange={e => setEndereco(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {carrinho.length === 0 && <div className="text-center text-gray-600 text-sm mt-10">Carrinho vazio</div>}
            {carrinho.map((item, idx) => (
              <div key={idx} className="bg-gray-800 p-2 rounded-lg flex justify-between items-center border border-gray-700">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium truncate">{item.produto.nome}</div>
                  <div className="text-xs text-gray-400">R$ {item.produto.preco.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3 bg-gray-900 rounded px-2 py-1">
                  <button onClick={() => updateQtd(idx, -1)} className="text-gray-400 hover:text-white font-bold">-</button>
                  <span className="text-white text-sm w-4 text-center">{item.quantidade}</span>
                  <button onClick={() => updateQtd(idx, 1)} className="text-gray-400 hover:text-white font-bold">+</button>
                </div>
                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 ml-2 px-2">✕</button>
              </div>
            ))}
          </div>

          {/* Rodapé e Pagamento */}
          <div className="p-4 bg-gray-850 border-t border-gray-800">
             <div className="grid grid-cols-2 gap-2 mb-4">
               <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="bg-gray-800 border border-gray-700 text-white text-sm rounded p-2 outline-none">
                 <option value="dinheiro">💵 Dinheiro</option>
                 <option value="pix">💠 Pix</option>
                 <option value="cartao">💳 Cartão</option>
               </select>
               {pagamento === 'dinheiro' && (
                 <input placeholder="Troco para..." type="number" className="bg-gray-800 border border-gray-700 text-white text-sm rounded p-2 outline-none" value={troco} onChange={e => setTroco(e.target.value)} />
               )}
             </div>

             <div className="space-y-1 text-sm mb-4">
               <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
               {tipoEntrega === 'delivery' && (
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa Entrega</span>
                    <input 
                      type="number" 
                      className="w-16 bg-transparent text-right border-b border-gray-600 focus:border-primary outline-none" 
                      value={taxaEntrega} 
                      onChange={e => setTaxaEntrega(Number(e.target.value))}
                    />
                  </div>
               )}
               <div className="flex justify-between text-xl font-bold text-green-400 pt-2 border-t border-gray-700"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
             </div>

             <div className="flex gap-3">
               <button onClick={onClose} className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600">Cancelar</button>
               <button onClick={handleSubmit} disabled={saving} className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 shadow-lg shadow-green-900/20 disabled:opacity-50">
                 {saving ? 'Lançando...' : 'LANÇAR PEDIDO ✅'}
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}