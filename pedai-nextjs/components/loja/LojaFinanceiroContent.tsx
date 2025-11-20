'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Transacao {
  id: number
  data: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  status: string
}

interface Resumo {
  saldoDisponivel: number
  aReceber: number
  totalVendido: number
  totalComissoes: number
}

export default function LojaFinanceiroContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7' | '15' | '30'>('30')
  
  const [todasTransacoes, setTodasTransacoes] = useState<Transacao[]>([])
  const [extratoFiltrado, setExtratoFiltrado] = useState<Transacao[]>([])
  const [resumo, setResumo] = useState<Resumo>({ saldoDisponivel: 0, aReceber: 0, totalVendido: 0, totalComissoes: 0 })

  useEffect(() => {
    loadDadosFinanceiros()
  }, [])

  // Filtra instantaneamente
  useEffect(() => {
    const dias = parseInt(periodo)
    const dataCorte = new Date()
    dataCorte.setDate(dataCorte.getDate() - dias)
    
    const filtrado = todasTransacoes.filter(t => new Date(t.data) >= dataCorte)
    setExtratoFiltrado(filtrado)

    // Recalcula resumo com base no filtrado
    let bruto = 0
    let comissoes = 0
    filtrado.forEach(t => {
      if (t.tipo === 'entrada') bruto += t.valor
      if (t.tipo === 'saida') comissoes += Math.abs(t.valor)
    })

    setResumo({
      saldoDisponivel: bruto - comissoes,
      aReceber: 0,
      totalVendido: bruto,
      totalComissoes: comissoes
    })

  }, [periodo, todasTransacoes])

  const loadDadosFinanceiros = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: loja } = await supabase.from('lojas').select('id, comissao_plataforma').eq('user_id', user.id).single()

    if (loja) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - 30) // Busca 30 dias
      
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', loja.id)
        .eq('status', 'entregue')
        .gte('created_at', dataLimite.toISOString())
        .order('created_at', { ascending: false })

      if (pedidos) {
        const lista: Transacao[] = []
        const taxaComissao = (loja.comissao_plataforma || 10) / 100

        pedidos.forEach(p => {
          lista.push({
            id: p.id,
            data: p.created_at,
            tipo: 'entrada',
            descricao: `Pedido #${p.id} (${p.forma_pagamento})`,
            valor: p.total,
            status: 'Concluído'
          })
          lista.push({
            id: p.id * 1000,
            data: p.created_at,
            tipo: 'saida',
            descricao: `Comissão (${(taxaComissao * 100).toFixed(0)}%)`,
            valor: -(p.total * taxaComissao),
            status: 'Debitado'
          })
        })
        setTodasTransacoes(lista)
      }
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div><h1 className="text-3xl font-bold text-white">Financeiro</h1><p className="text-gray-400 text-sm">Acompanhe seus ganhos</p></div>
          </div>
          <div className="flex bg-gray-800 p-1 rounded-lg">
            {['7', '15', '30'].map(d => (
              <button key={d} onClick={() => setPeriodo(d as any)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${periodo === d ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>{d}d</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 shadow-lg"><p className="text-gray-400 text-sm mb-1">Saldo Líquido</p><h3 className="text-3xl font-bold text-green-400">R$ {resumo.saldoDisponivel.toFixed(2)}</h3></div>
          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg"><p className="text-gray-400 text-sm mb-1">Vendas Brutas</p><h3 className="text-3xl font-bold text-white">R$ {resumo.totalVendido.toFixed(2)}</h3></div>
          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-red-500 shadow-lg"><p className="text-gray-400 text-sm mb-1">Comissões</p><h3 className="text-3xl font-bold text-red-400">- R$ {resumo.totalComissoes.toFixed(2)}</h3></div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs"><tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-gray-700">
                {extratoFiltrado.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma movimentação.</td></tr> : 
                  extratoFiltrado.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-gray-300">{new Date(item.data).toLocaleDateString()}</td>
                      <td className="p-4 text-white font-medium">{item.descricao}</td>
                      <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${item.tipo === 'entrada' ? 'bg-green-500/10 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>{item.status}</span></td>
                      <td className={`p-4 text-right font-bold ${item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>{item.tipo === 'entrada' ? '+' : ''} R$ {item.valor.toFixed(2)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}