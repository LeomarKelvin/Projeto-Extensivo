'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'

interface SessaoCaixa {
  id: number
  status: 'aberto' | 'fechado'
  data_abertura: string
  valor_abertura: number
  valor_calculado?: number
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
  
  const [caixaAtual, setCaixaAtual] = useState<SessaoCaixa | null>(null)
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [resumo, setResumo] = useState({ dinheiro: 0, pix: 0, cartao: 0, total: 0 })
  const [isCheckingCaixa, setIsCheckingCaixa] = useState(true)

  const [showModalAbertura, setShowModalAbertura] = useState(false)
  const [showModalMovimento, setShowModalMovimento] = useState(false)
  const [tipoMovimento, setTipoMovimento] = useState<'sangria' | 'suprimento'>('suprimento')
  
  const [valorInput, setValorInput] = useState('')
  const [obsInput, setObsInput] = useState('')

  useEffect(() => {
    if (loja) {
      checkCaixaAberto(loja.id)
    } else if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [loja, authLoading])

  const checkCaixaAberto = async (id: number) => {
    const supabase = createClient()
    const { data: sessoes, error } = await supabase
      .from('caixa_sessoes')
      .select('*')
      .eq('loja_id', id)
      .eq('status', 'aberto')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar caixa:", error)
    }

    if (sessoes && sessoes.length > 0) {
      const sessao = sessoes[0]
      setCaixaAtual(sessao)
      loadMovimentos(sessao.id)
    } else {
      setCaixaAtual(null)
      setMovimentos([])
      setResumo({ dinheiro: 0, pix: 0, cartao: 0, total: 0 })
    }
    setIsCheckingCaixa(false)
  }

  const loadMovimentos = async (sessaoId: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('caixa_movimentos')
      .select('*')
      .eq('sessao_id', sessaoId)
      .order('created_at', { ascending: false })

    if (data) {
      setMovimentos(data)
      calcularResumo(data)
    }
  }

  const calcularResumo = (movs: Movimento[]) => {
    let din = 0; let pix = 0; let card = 0

    movs.forEach(m => {
      const val = m.tipo === 'sangria' ? -m.valor : m.valor
      
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

  const abrirCaixa = async () => {
    if (!loja || !user) return alert('Erro: Loja ou usuário não identificados.')
    const valor = parseFloat(valorInput.replace(',', '.') || '0')
    
    const supabase = createClient()

    // 1. Criar Sessão
    const { data: sessao, error } = await supabase.from('caixa_sessoes').insert({
      loja_id: loja.id,
      user_id: user.id,
      valor_abertura: valor,
      status: 'aberto'
    }).select().single()

    if (error) {
      console.error("Erro ao abrir sessão:", error)
      return alert('Erro ao abrir caixa: ' + error.message)
    }

    // 2. Registrar Movimento Inicial
    const { error: movError } = await supabase.from('caixa_movimentos').insert({
      sessao_id: sessao.id,
      tipo: 'abertura',
      valor: valor,
      descricao: 'Fundo de Caixa',
      forma_pagamento: 'dinheiro'
    })

    if (movError) {
      console.error("Erro ao criar movimento:", movError)
    }

    setShowModalAbertura(false)
    setValorInput('')
    
    // 3. Forçar recarregamento
    checkCaixaAberto(loja.id)
  }

  const fecharCaixa = async () => {
    if (!caixaAtual) return
    const supabase = createClient()
    await supabase.from('caixa_sessoes').update({
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      valor_calculado: resumo.total,
      valor_fechamento: resumo.total
    }).eq('id', caixaAtual.id)
    
    setCaixaAtual(null)
    setMovimentos([])
    alert('Caixa fechado com sucesso! 🔒')
  }

  const lancarMovimento = async () => {
    if (!caixaAtual) return
    const valor = parseFloat(valorInput.replace(',', '.'))
    if (!valor || valor <= 0) return alert('Valor inválido')

    const supabase = createClient()
    const { error } = await supabase.from('caixa_movimentos').insert({
      sessao_id: caixaAtual.id,
      tipo: tipoMovimento,
      valor: valor,
      descricao: obsInput || (tipoMovimento === 'sangria' ? 'Retirada' : 'Suprimento'),
      forma_pagamento: 'dinheiro'
    })

    if (error) alert('Erro: ' + error.message)
    else {
      setShowModalMovimento(false)
      setValorInput('')
      setObsInput('')
      loadMovimentos(caixaAtual.id)
    }
  }

  if (authLoading || isCheckingCaixa) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando caixa...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Frente de Caixa</h1>
              <p className="text-gray-400 text-sm">Controle de turno e gaveta</p>
            </div>
          </div>
          
          {caixaAtual ? (
            <button onClick={fecharCaixa} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105">Fechar Caixa</button>
          ) : (
            <button onClick={() => setShowModalAbertura(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg animate-pulse">Abrir Caixa</button>
          )}
        </div>

        {caixaAtual ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Dinheiro</p><h3 className="text-2xl font-bold text-green-400">R$ {resumo.dinheiro.toFixed(2)}</h3></div>
              <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Pix</p><h3 className="text-2xl font-bold text-blue-400">R$ {resumo.pix.toFixed(2)}</h3></div>
              <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Cartão</p><h3 className="text-2xl font-bold text-yellow-400">R$ {resumo.cartao.toFixed(2)}</h3></div>
              <div className="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-md"><p className="text-gray-400 text-xs uppercase font-bold">Total</p><h3 className="text-2xl font-bold text-white">R$ {resumo.total.toFixed(2)}</h3></div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setTipoMovimento('suprimento'); setShowModalMovimento(true) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-900/50 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all hover:border-green-500"><span className="text-2xl">📥</span> Suprimento</button>
              <button onClick={() => { setTipoMovimento('sangria'); setShowModalMovimento(true) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-red-400 border border-red-900/50 py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all hover:border-red-500"><span className="text-2xl">📤</span> Sangria</button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
              <div className="p-4 bg-gray-900/50 border-b border-gray-700 font-bold text-white flex justify-between"><span>Extrato</span><span className="text-xs text-gray-400 font-normal">Aberto: {new Date(caixaAtual.data_abertura).toLocaleString()}</span></div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-500 border-b border-gray-700 bg-gray-900/30"><tr><th className="p-4">Hora</th><th className="p-4">Tipo</th><th className="p-4">Descrição</th><th className="p-4 text-right">Valor</th></tr></thead>
                  <tbody className="divide-y divide-gray-700 text-gray-300">
                    {movimentos.map(m => (
                      <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${m.tipo === 'sangria' ? 'bg-red-900/50 text-red-400 border border-red-900' : 'bg-green-900/50 text-green-400 border border-green-900'}`}>{m.tipo}</span></td>
                        <td className="p-4">{m.descricao}</td>
                        <td className={`p-4 text-right font-bold ${m.tipo === 'sangria' ? 'text-red-400' : 'text-green-400'}`}>{m.tipo === 'sangria' ? '-' : '+'} R$ {m.valor.toFixed(2)}</td>
                      </tr>
                    ))}
                    {movimentos.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma movimentação.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
            <div className="text-6xl mb-4 opacity-50">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Caixa Fechado</h2>
            <p className="mb-6 text-center max-w-md">Abra o caixa para iniciar as operações.</p>
            <button onClick={() => setShowModalAbertura(true)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"><span>🔓</span> Iniciar Dia</button>
          </div>
        )}
      </div>

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

      {showModalMovimento && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white capitalize">{tipoMovimento}</h3><button onClick={() => setShowModalMovimento(false)} className="text-gray-400 hover:text-white">✕</button></div>
            <div className="space-y-4">
              <div><label className="block text-gray-400 text-sm mb-2">Valor</label><input type="number" autoFocus value={valorInput} onChange={e => setValorInput(e.target.value)} className="w-full bg-gray-900 text-white text-2xl p-4 rounded-lg border border-gray-600 focus:border-primary outline-none" placeholder="0,00" /></div>
              <div><label className="block text-gray-400 text-sm mb-2">Motivo</label><input value={obsInput} onChange={e => setObsInput(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" placeholder="Ex: Pagamento" /></div>
            </div>
            <button onClick={lancarMovimento} className={`w-full py-4 mt-6 font-bold rounded-xl text-white transition-colors shadow-lg ${tipoMovimento === 'sangria' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>Confirmar</button>
          </div>
        </div>
      )}
    </div>
  )
}