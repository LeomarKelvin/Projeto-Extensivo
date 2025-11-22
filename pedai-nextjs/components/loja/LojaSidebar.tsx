'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCaixaStore } from '@/lib/stores/useCaixaStore'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface SessaoResumo {
  id: number
  valor_abertura: number
  data_abertura: string
  data_fechamento?: string
  user_id?: string
}

export default function LojaSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Controle da Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const { isOpen, caixaId, setCaixaStatus } = useCaixaStore()
  const { user, loja } = useAuth()

  // Modais
  const [showAbertura, setShowAbertura] = useState(false)
  const [showGestao, setShowGestao] = useState(false)
  const [showMovimento, setShowMovimento] = useState(false)
  const [showResumo, setShowResumo] = useState(false)
  const [showFechamento, setShowFechamento] = useState(false)
  
  const [tipoMovimento, setTipoMovimento] = useState<'sangria' | 'suprimento'>('suprimento')
  const [valorInput, setValorInput] = useState('')
  const [obsInput, setObsInput] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)
  
  const [resumoDados, setResumoDados] = useState({
    abertura: 0, vendas: 0, suprimentos: 0, sangrias: 0,
    totalDinheiro: 0, totalPix: 0, totalCartao: 0, saldoFinal: 0
  })
  const [sessaoImpressao, setSessaoImpressao] = useState<SessaoResumo | null>(null)
  const [movimentosImpressao, setMovimentosImpressao] = useState<any[]>([])

  // Sincronização Inicial
  useEffect(() => {
    const syncCaixaStatus = async () => {
      if (!loja) return
      const supabase = createClient()
      const { data } = await supabase.from('caixa_sessoes').select('id').eq('loja_id', loja.id).eq('status', 'aberto').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) setCaixaStatus(true, data.id)
      else setCaixaStatus(false, null)
    }
    syncCaixaStatus()
  }, [loja, setCaixaStatus])

  // Carregar dados do caixa
  const carregarDadosCaixa = async () => {
    if (!caixaId) return
    setLoadingAction(true)
    const supabase = createClient()

    const { data: sessao } = await supabase.from('caixa_sessoes').select('*').eq('id', caixaId).single()
    const { data: movimentos } = await supabase.from('caixa_movimentos').select('*').eq('sessao_id', caixaId).order('created_at', { ascending: true })

    if (sessao && movimentos) {
      setSessaoImpressao(sessao)
      setMovimentosImpressao(movimentos)

      let vendas = 0, suprimentos = 0, sangrias = 0
      let din = sessao.valor_abertura, pix = 0, card = 0

      movimentos.forEach(m => {
        const val = m.valor
        if (m.tipo === 'venda') vendas += val
        if (m.tipo === 'suprimento') suprimentos += val
        if (m.tipo === 'sangria') sangrias += val

        const isSaida = m.tipo === 'sangria'
        if (m.forma_pagamento === 'dinheiro' || !m.forma_pagamento) {
           if (m.tipo !== 'abertura') din = isSaida ? din - val : din + val
        } else if (m.forma_pagamento === 'pix') {
           pix = isSaida ? pix - val : pix + val
        } else if (m.forma_pagamento === 'cartao') {
           card = isSaida ? card - val : card + val
        }
      })

      setResumoDados({
        abertura: sessao.valor_abertura,
        vendas, suprimentos, sangrias,
        totalDinheiro: din, totalPix: pix, totalCartao: card,
        saldoFinal: (sessao.valor_abertura + vendas + suprimentos) - sangrias
      })
    }
    setLoadingAction(false)
  }

  const handleCardClick = () => isOpen ? setShowGestao(true) : setShowAbertura(true)
  
  const handleOpenResumo = async () => { await carregarDadosCaixa(); setShowGestao(false); setShowResumo(true) }
  const handleOpenFechamento = async () => { await carregarDadosCaixa(); setShowGestao(false); setShowFechamento(true) }

  const abrirCaixaRapido = async () => {
    if (!loja || !user) return
    setLoadingAction(true)
    const valor = parseFloat(valorInput.replace(',', '.') || '0')
    const supabase = createClient()
    try {
      const { data: sessao, error } = await supabase.from('caixa_sessoes').insert({ loja_id: loja.id, user_id: user.id, valor_abertura: valor, status: 'aberto' }).select().single()
      if (error) throw error
      await supabase.from('caixa_movimentos').insert({ sessao_id: sessao.id, tipo: 'abertura', valor: valor, descricao: 'Fundo (Via Sidebar)', forma_pagamento: 'dinheiro' })
      setCaixaStatus(true, sessao.id)
      setShowAbertura(false)
      setValorInput('')
      if (pathname === '/loja/caixa') window.location.reload()
    } catch (error: any) { alert('Erro ao abrir: ' + error.message) } finally { setLoadingAction(false) }
  }

  const confirmarFechamento = async () => {
    if (!caixaId) return
    setLoadingAction(true)
    const supabase = createClient()
    try {
      await supabase.from('caixa_sessoes').update({ status: 'fechado', data_fechamento: new Date().toISOString(), valor_fechamento: resumoDados.saldoFinal }).eq('id', caixaId)
      setCaixaStatus(false, null)
      setShowFechamento(false)
      alert('Caixa Fechado com Sucesso! 🔒')
      if (pathname === '/loja/caixa') window.location.reload()
    } catch (error: any) { alert('Erro: ' + error.message) } finally { setLoadingAction(false) }
  }

  const lancarMovimentoRapido = async () => {
    if (!caixaId) return
    const valor = parseFloat(valorInput.replace(',', '.'))
    if (!valor || valor <= 0) return alert('Valor inválido')
    setLoadingAction(true)
    const supabase = createClient()
    try {
      const defaultDesc = tipoMovimento === 'sangria' ? 'Pagamento' : 'Troco'
      await supabase.from('caixa_movimentos').insert({ sessao_id: caixaId, tipo: tipoMovimento, valor: valor, descricao: obsInput || defaultDesc, forma_pagamento: 'dinheiro' })
      setShowMovimento(false)
      setValorInput(''); setObsInput('')
      alert('Lançamento realizado! ✅')
      if (pathname === '/loja/caixa') window.location.reload()
    } catch (error: any) { alert('Erro: ' + error.message) } finally { setLoadingAction(false) }
  }

  const menuItems = [
    { href: '/loja/dashboard', icon: '🏠', label: 'Início' },
    { href: '/loja/pedidos', icon: '📋', label: 'Pedidos' },
    { href: '/loja/caixa', icon: '💵', label: 'Frente de Caixa' },
    { href: '/loja/produtos', icon: '🛒', label: 'Produtos' },
    { href: '/loja/entregadores', icon: '🏍️', label: 'Entregadores' },
    { href: '/loja/clientes', icon: '👥', label: 'Clientes' },
    { href: '/loja/financeiro', icon: '💳', label: 'Financeiro' },
    { href: '/loja/relatorios', icon: '📊', label: 'Relatórios' },
    { href: '/loja/promocoes', icon: '🎁', label: 'Promoções' },
    { href: '/loja/automacao', icon: '🤖', label: 'Automação' },
    { href: '/loja/configuracoes', icon: '⚙️', label: 'Configurações' },
  ]

  return (
    <aside 
      className={`hidden md:flex flex-col bg-gray-800 border-r border-gray-700 min-h-screen flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* TOPO: TOGGLE + TÍTULO */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-gray-700`}>
        {!isCollapsed && <span className="text-white font-bold text-lg tracking-wide">Menu</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {/* Ícone de Menu (3 Barrinhas) */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* CARD DO CAIXA (LOGO ABAIXO DO TOPO) */}
      <div className="p-4 border-b border-gray-700">
        <div 
          onClick={handleCardClick}
          className={`
            cursor-pointer transition-all transform hover:scale-[1.02] shadow-lg border relative overflow-hidden group rounded-xl
            ${isCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center mx-auto' : 'p-4'}
            ${isOpen 
              ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-500' 
              : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500'
            }
          `}
          title={isCollapsed ? (isOpen ? 'Caixa Aberto' : 'Caixa Fechado') : ''}
        >
          {isCollapsed ? (
             // Ícone Compacto (Apenas o cadeado)
             <span className="text-xl text-white font-bold">
               {isOpen ? '🔓' : '🔒'}
             </span>
          ) : (
             // Card Completo
             <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-sm flex items-center gap-2">{isOpen ? '🔓 ABERTO' : '🔒 FECHADO'}</span>
                <div className={`w-2 h-2 rounded-full bg-white ${isOpen ? 'animate-ping' : ''}`}></div>
              </div>
              <p className="text-white text-xs font-medium opacity-90">{isOpen ? 'Toque para opções' : 'Toque para iniciar o dia'}</p>
             </>
          )}
          {/* Efeito visual ao passar o mouse */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
        </div>
      </div>
      
      {/* MENU DE NAVEGAÇÃO */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`
                    flex items-center rounded-lg transition-all duration-200
                    ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                    ${isActive ? 'bg-primary text-secondary font-bold shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* RODAPÉ (Versão) */}
      <div className="p-4 border-t border-gray-700 text-center">
        <p className="text-gray-500 text-[10px] whitespace-nowrap">{isCollapsed ? 'v2.0' : 'PedeAí v2.0'}</p>
      </div>

      {/* --- MODAIS (Abertura, Gestão, Movimento, Resumo, Fechamento) --- */}
      {/* (Mantidos exatamente como no código anterior, funcionais e corrigidos) */}

      {showAbertura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Abrir Caixa</h3>
            <label className="block text-gray-400 text-xs mb-2">Fundo de Troco (R$)</label>
            <input type="number" autoFocus value={valorInput} onChange={e => setValorInput(e.target.value)} className="w-full bg-gray-900 text-white text-2xl p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none mb-6 font-bold" placeholder="0,00" />
            <div className="flex gap-2"><button onClick={() => setShowAbertura(false)} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">Cancelar</button><button onClick={abrirCaixaRapido} disabled={loadingAction} className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 text-sm">{loadingAction ? '...' : 'Abrir'}</button></div>
          </div>
        </div>
      )}

      {showGestao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setShowGestao(false)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-xs p-5 border border-gray-700 shadow-2xl transform scale-100">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">Gestão Rápida</h3><button onClick={() => setShowGestao(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <div className="space-y-3">
              <button onClick={() => { setTipoMovimento('suprimento'); setValorInput(''); setShowGestao(false); setShowMovimento(true); }} className="w-full bg-gray-700 hover:bg-gray-600 text-green-400 py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors border border-gray-600"><span className="text-xl">📥</span> Suprimento</button>
              <button onClick={() => { setTipoMovimento('sangria'); setValorInput(''); setShowGestao(false); setShowMovimento(true); }} className="w-full bg-gray-700 hover:bg-gray-600 text-red-400 py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors border border-gray-600"><span className="text-xl">📤</span> Sangria</button>
              <button onClick={handleOpenResumo} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors"><span className="text-xl">📊</span> Resumo</button>
              <div className="h-px bg-gray-700 my-2"></div>
              <button onClick={handleOpenFechamento} className="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-all border border-red-900/50"><span className="text-xl">🔒</span> Fechar Caixa</button>
            </div>
          </div>
        </div>
      )}

      {showMovimento && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 capitalize flex items-center gap-2">{tipoMovimento === 'sangria' ? '📤 Nova Sangria' : '📥 Novo Suprimento'}</h3>
            <div className="space-y-4"><div><label className="block text-gray-400 text-xs mb-1">Valor (R$)</label><input type="number" autoFocus value={valorInput} onChange={e => setValorInput(e.target.value)} className="w-full bg-gray-900 text-white text-2xl p-3 rounded-lg border border-gray-600 focus:border-primary outline-none font-bold" placeholder="0,00" /></div><div><label className="block text-gray-400 text-xs mb-1">Descrição</label><input value={obsInput} onChange={e => setObsInput(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none text-sm" placeholder={tipoMovimento === 'sangria' ? "Ex: Troco" : "Ex: Pagamento"} /></div></div>
            <div className="flex gap-2 mt-6"><button onClick={() => setShowMovimento(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">Voltar</button><button onClick={lancarMovimentoRapido} disabled={loadingAction} className={`flex-1 py-3 font-bold rounded-lg text-white text-sm ${tipoMovimento === 'sangria' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>{loadingAction ? 'Salvando...' : 'Confirmar'}</button></div>
          </div>
        </div>
      )}

      {showResumo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Resumo do Dia</h3><button onClick={() => setShowResumo(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 p-3 rounded-lg border border-green-900/50"><p className="text-gray-400 text-xs">Dinheiro</p><p className="text-green-400 font-bold text-lg">R$ {resumoDados.totalDinheiro.toFixed(2)}</p></div>
              <div className="bg-gray-900 p-3 rounded-lg border border-blue-900/50"><p className="text-gray-400 text-xs">Pix</p><p className="text-blue-400 font-bold text-lg">R$ {resumoDados.totalPix.toFixed(2)}</p></div>
              <div className="bg-gray-900 p-3 rounded-lg border border-yellow-900/50"><p className="text-gray-400 text-xs">Cartão</p><p className="text-yellow-400 font-bold text-lg">R$ {resumoDados.totalCartao.toFixed(2)}</p></div>
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600"><p className="text-gray-300 text-xs">Total Geral</p><p className="text-white font-bold text-lg">R$ {resumoDados.saldoFinal.toFixed(2)}</p></div>
            </div>
            <button onClick={() => setShowResumo(false)} className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600">Voltar</button>
          </div>
        </div>
      )}

      {showFechamento && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Fechamento</h3><button onClick={() => setShowFechamento(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <div className="space-y-3 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-600">
              <div className="flex justify-between text-sm"><span className="text-gray-400">(+) Abertura</span><span className="text-white">R$ {resumoDados.abertura.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">(+) Vendas</span><span className="text-green-400">R$ {resumoDados.vendas.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">(+) Suprimentos</span><span className="text-blue-400">R$ {resumoDados.suprimentos.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm border-b border-gray-700 pb-2"><span className="text-gray-400">(-) Sangrias</span><span className="text-red-400">R$ {resumoDados.sangrias.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-1"><span>Saldo Final</span><span className="text-white">R$ {resumoDados.saldoFinal.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFechamento(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancelar</button>
              <button onClick={confirmarFechamento} disabled={loadingAction} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 shadow-lg">{loadingAction ? '...' : 'Confirmar Fechamento'}</button>
            </div>
          </div>
        </div>
      )}

    </aside>
  )
}