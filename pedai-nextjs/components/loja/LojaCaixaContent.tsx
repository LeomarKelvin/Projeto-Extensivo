'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useCaixaStore } from '@/lib/stores/useCaixaStore' // Importante para a Sidebar
import { imprimirRelatorioCaixa } from '@/lib/utils/printCaixa'

interface SessaoCaixa {
  id: number
  status: 'aberto' | 'fechado'
  data_abertura: string
  data_fechamento?: string
  valor_abertura: number
  valor_calculado?: number
  valor_fechamento?: number
}

interface Movimento {
  id: number
  tipo: 'abertura' | 'venda' | 'sangria' | 'suprimento' | 'fechamento'
  valor: number
  descricao: string
  created_at: string
  forma_pagamento?: string
}

export default function LojaCaixaContent() {
  const router = useRouter()
  const { user, loja, loading: authLoading } = useAuth()
  const { setCaixaStatus } = useCaixaStore() // Conecta com a Sidebar
  
  const [activeTab, setActiveTab] = useState<'atual' | 'historico'>('atual')
  
  // Estado Caixa Atual
  const [caixaAtual, setCaixaAtual] = useState<SessaoCaixa | null>(null)
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [resumo, setResumo] = useState({ dinheiro: 0, pix: 0, cartao: 0, total: 0 })
  const [printerWidth, setPrinterWidth] = useState(80) // Padrão 80mm

  // Estado Histórico
  const [historicoSessoes, setHistoricoSessoes] = useState<SessaoCaixa[]>([])
  const [selectedHistorico, setSelectedHistorico] = useState<SessaoCaixa | null>(null)
  const [movimentosHistorico, setMovimentosHistorico] = useState<Movimento[]>([])

  // Modais
  const [showModalAbertura, setShowModalAbertura] = useState(false)
  const [showModalMovimento, setShowModalMovimento] = useState(false)
  const [tipoMovimento, setTipoMovimento] = useState<'sangria' | 'suprimento'>('suprimento')
  
  const [valorInput, setValorInput] = useState('')
  const [obsInput, setObsInput] = useState('')

  // Inicialização
  useEffect(() => {
    if (loja) {
      checkCaixaAberto(loja.id)
      loadPrinterConfig(loja.id)
      if (activeTab === 'historico') loadHistorico(loja.id)
    } else if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [loja, authLoading, activeTab])

  // Busca configuração da impressora
  const loadPrinterConfig = async (id: number) => {
    const supabase = createClient()
    const { data } = await supabase.from('lojas').select('impressora_largura').eq('id', id).single()
    if (data?.impressora_largura) setPrinterWidth(data.impressora_largura)
  }

  // Verifica se existe caixa aberto
  const checkCaixaAberto = async (id: number) => {
    const supabase = createClient()
    const { data: sessoes } = await supabase
      .from('caixa_sessoes')
      .select('*')
      .eq('loja_id', id)
      .eq('status', 'aberto')
      .order('created_at', { ascending: false })
      .limit(1)

    if (sessoes && sessoes.length > 0) {
      const sessao = sessoes[0]
      setCaixaAtual(sessao)
      setCaixaStatus(true, sessao.id) // Atualiza a Sidebar para "Aberto"
      loadMovimentos(sessao.id, setMovimentos, true)
    } else {
      setCaixaAtual(null)
      setCaixaStatus(false, null) // Atualiza a Sidebar para "Fechado"
      setMovimentos([])
      setResumo({ dinheiro: 0, pix: 0, cartao: 0, total: 0 })
    }
  }

  // Carrega histórico de fechamentos
  const loadHistorico = async (id: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('caixa_sessoes')
      .select('*')
      .eq('loja_id', id)
      .eq('status', 'fechado')
      .order('data_fechamento', { ascending: false })
      .limit(30)
    
    if (data) setHistoricoSessoes(data)
  }

  // Carrega movimentos de uma sessão
  const loadMovimentos = async (sessaoId: number, setState: any, calcResumo = false) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('caixa_movimentos')
      .select('*')
      .eq('sessao_id', sessaoId)
      .order('created_at', { ascending: false })

    if (data) {
      setState(data)
      if (calcResumo) calcularResumo(data)
    }
  }

  // Calcula totais
  const calcularResumo = (movs: Movimento[]) => {
    let din = 0; let pix = 0; let card = 0
    movs.forEach(m => {
      const val = m.tipo === 'sangria' ? -m.valor : m.valor
      
      // Abertura, Suprimento e Venda (Dinheiro) somam no caixa físico
      if (m.forma_pagamento === 'dinheiro' || !m.forma_pagamento) {
        din += val
      } else if (m.forma_pagamento === 'pix') {
        pix += val
      } else if (m.forma_pagamento === 'cartao') {
        card += val
      }
    })
    setResumo({ dinheiro: din, pix, cartao: card, total: din + pix + card })
  }

  // --- AÇÕES ---

  const abrirCaixa = async () => {
    if (!loja || !user) return alert('Erro de autenticação.')
    const valor = parseFloat(valorInput.replace(',', '.') || '0')
    const supabase = createClient()

    const { data: sessao, error } = await supabase.from('caixa_sessoes').insert({
      loja_id: loja.id,
      user_id: user.id,
      valor_abertura: valor,
      status: 'aberto'
    }).select().single()

    if (error) return alert('Erro: ' + error.message)

    // Registra fundo de caixa
    await supabase.from('caixa_movimentos').insert({
      sessao_id: sessao.id,
      tipo: 'abertura',
      valor: valor,
      descricao: 'Fundo de Caixa',
      forma_pagamento: 'dinheiro'
    })

    setShowModalAbertura(false)
    setValorInput('')
    checkCaixaAberto(loja.id)
  }

  const fecharCaixa = async () => {
    if (!caixaAtual) return
    if (!confirm('Tem certeza que deseja fechar o caixa?')) return

    const supabase = createClient()
    await supabase.from('caixa_sessoes').update({
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      valor_calculado: resumo.total,
      valor_fechamento: resumo.total // Em produção, pediria conferência cega
    }).eq('id', caixaAtual.id)
    
    setCaixaAtual(null)
    setCaixaStatus(false, null) // Atualiza Sidebar
    setMovimentos([])
    alert('Caixa fechado com sucesso! 🔒')
    
    if (activeTab === 'historico') loadHistorico(loja!.id)
  }

  const lancarMovimento = async () => {
    if (!caixaAtual) return
    const valor = parseFloat(valorInput.replace(',', '.'))
    if (!valor || valor <= 0) return alert('Valor inválido')

    const supabase = createClient()
    
    // Define descrição padrão baseada no tipo (Conforme solicitado)
    const defaultDesc = tipoMovimento === 'sangria' ? 'Troco' : 'Pagamento'

    const { error } = await supabase.from('caixa_movimentos').insert({
      sessao_id: caixaAtual.id,
      tipo: tipoMovimento,
      valor: valor,
      descricao: obsInput || defaultDesc,
      forma_pagamento: 'dinheiro'
    })

    if (error) alert('Erro: ' + error.message)
    else {
      setShowModalMovimento(false)
      setValorInput('')
      setObsInput('')
      loadMovimentos(caixaAtual.id, setMovimentos, true)
    }
  }

  const openDetalhesHistorico = (sessao: SessaoCaixa) => {
    setSelectedHistorico(sessao)
    loadMovimentos(sessao.id, setMovimentosHistorico)
  }

  if (authLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Frente de Caixa</h1>
              <p className="text-gray-400 text-sm">Controle financeiro diário</p>
            </div>
          </div>
          
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('atual')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'atual' ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>Caixa Atual</button>
            <button onClick={() => setActiveTab('historico')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'historico' ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>Histórico</button>
          </div>
        </div>

        {/* ABA ATUAL */}
        {activeTab === 'atual' && (
          <>
            {caixaAtual ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-end">
                   <button onClick={fecharCaixa} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg">Fechar Caixa</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Dinheiro (Gaveta)</p><h3 className="text-2xl font-bold text-green-400">R$ {resumo.dinheiro.toFixed(2)}</h3></div>
                  <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Pix</p><h3 className="text-2xl font-bold text-blue-400">R$ {resumo.pix.toFixed(2)}</h3></div>
                  <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Cartão</p><h3 className="text-2xl font-bold text-yellow-400">R$ {resumo.cartao.toFixed(2)}</h3></div>
                  <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Total Geral</p><h3 className="text-2xl font-bold text-white">R$ {resumo.total.toFixed(2)}</h3></div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => { setTipoMovimento('suprimento'); setShowModalMovimento(true) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-900/50 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all"><span className="text-2xl">📥</span> Suprimento</button>
                  <button onClick={() => { setTipoMovimento('sangria'); setShowModalMovimento(true) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-red-400 border border-red-900/50 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all"><span className="text-2xl">📤</span> Sangria</button>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                  <div className="p-4 bg-gray-900/50 border-b border-gray-700 font-bold text-white flex justify-between"><span>Extrato do Turno</span><span className="text-xs text-gray-400 font-normal">Aberto: {new Date(caixaAtual.data_abertura).toLocaleString()}</span></div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                      <thead className="text-gray-500 border-b border-gray-700 bg-gray-900/30"><tr><th className="p-4">Hora</th><th className="p-4">Tipo</th><th className="p-4">Descrição</th><th className="p-4 text-right">Valor</th></tr></thead>
                      <tbody className="divide-y divide-gray-700 text-gray-300">
                        {movimentos.map(m => (
                          <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="p-4 font-mono text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${m.tipo === 'sangria' ? 'bg-red-900/50 text-red-400 border border-red-900' : m.tipo === 'abertura' ? 'bg-blue-900/50 text-blue-400 border border-blue-900' : 'bg-green-900/50 text-green-400 border border-green-900'}`}>{m.tipo}</span></td>
                            <td className="p-4">{m.descricao}</td>
                            <td className={`p-4 text-right font-bold ${m.tipo === 'sangria' ? 'text-red-400' : 'text-green-400'}`}>{m.tipo === 'sangria' ? '-' : '+'} R$ {m.valor.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
                <div className="text-6xl mb-4 opacity-50">🔒</div>
                <h2 className="text-2xl font-bold text-white mb-2">Caixa Fechado</h2>
                <p className="mb-6 text-center max-w-md">O caixa está fechado. Abra uma nova sessão para começar a registrar vendas e movimentos.</p>
                <button onClick={() => setShowModalAbertura(true)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"><span>🔓</span> Iniciar Dia</button>
              </div>
            )}
          </>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-700"><h3 className="text-white font-bold">Histórico de Fechamentos</h3></div>
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 bg-gray-900/50 text-xs uppercase"><tr><th className="p-4">Data Abertura</th><th className="p-4">Data Fechamento</th><th className="p-4 text-right">Valor Final</th><th className="p-4 text-center">Ação</th></tr></thead>
              <tbody className="divide-y divide-gray-700 text-gray-300">
                {historicoSessoes.length === 0 ? <tr><td colSpan={4} className="p-8 text-center">Nenhum histórico encontrado.</td></tr> : 
                  historicoSessoes.map(s => (
                    <tr key={s.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">{new Date(s.data_abertura).toLocaleString()}</td>
                      <td className="p-4">{s.data_fechamento ? new Date(s.data_fechamento).toLocaleString() : 'Em aberto'}</td>
                      <td className="p-4 text-right font-bold text-green-400">R$ {s.valor_fechamento?.toFixed(2) || '0.00'}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => openDetalhesHistorico(s)} className="text-blue-400 hover:text-white text-xs underline">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL ABERTURA */}
      {showModalAbertura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Abrir Caixa</h3><button onClick={() => setShowModalAbertura(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <label className="block text-gray-400 text-sm mb-2">Fundo de Troco</label>
            <div className="relative mb-6"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">R$</span><input type="number" autoFocus value={valorInput} onChange={e => setValorInput(e.target.value)} className="w-full bg-gray-900 text-white text-3xl p-4 pl-12 rounded-xl border border-gray-600 focus:border-green-500 outline-none font-bold" placeholder="0,00" /></div>
            <button onClick={abrirCaixa} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors shadow-lg">Confirmar Abertura</button>
          </div>
        </div>
      )}

      {/* MODAL MOVIMENTO */}
      {showModalMovimento && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">{tipoMovimento === 'sangria' ? '📤 Sangria' : '📥 Suprimento'}</h3><button onClick={() => setShowModalMovimento(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <div className="space-y-4">
              <div><label className="block text-gray-400 text-sm mb-2">Valor (R$)</label><input type="number" autoFocus value={valorInput} onChange={e => setValorInput(e.target.value)} className="w-full bg-gray-900 text-white text-2xl p-4 rounded-lg border border-gray-600 focus:border-primary outline-none font-bold" placeholder="0,00" /></div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Motivo</label>
                {/* PLACEHOLDER ATUALIZADO AQUI */}
                <input 
                  value={obsInput} 
                  onChange={e => setObsInput(e.target.value)} 
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" 
                  placeholder={tipoMovimento === 'sangria' ? "Ex: Troco" : "Ex: Pagamento"} 
                />
              </div>
            </div>
            <button onClick={lancarMovimento} className={`w-full py-4 mt-6 font-bold rounded-xl text-white transition-colors shadow-lg ${tipoMovimento === 'sangria' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>Confirmar</button>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO HISTÓRICO */}
      {selectedHistorico && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl h-[80vh] border border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-2xl">
              <div><h2 className="text-xl font-bold text-white">Detalhes do Caixa #{selectedHistorico.id}</h2><p className="text-gray-400 text-sm">{new Date(selectedHistorico.data_abertura).toLocaleDateString()}</p></div>
              <button onClick={() => setSelectedHistorico(null)} className="text-white bg-red-600 hover:bg-red-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
               <div className="space-y-2">
                 {movimentosHistorico.map(m => (
                   <div key={m.id} className="flex justify-between border-b border-gray-700 pb-2 text-sm text-gray-300">
                     <span>{m.tipo.toUpperCase()} - {m.descricao}</span>
                     <span className={m.tipo === 'sangria' ? 'text-red-400' : 'text-green-400'}>R$ {m.valor.toFixed(2)}</span>
                   </div>
                 ))}
               </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-2xl flex justify-end">
               <button 
                 onClick={() => imprimirRelatorioCaixa(selectedHistorico, movimentosHistorico, loja?.nome_loja || 'Loja', printerWidth)}
                 className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
               >
                 🖨️ Imprimir Relatório
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}