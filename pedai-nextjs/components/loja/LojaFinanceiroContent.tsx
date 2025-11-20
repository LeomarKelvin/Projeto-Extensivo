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
  const [resumo, setResumo] = useState<Resumo>({ saldoDisponivel: 0, aReceber: 0, totalVendido: 0, totalComissoes: 0 })
  const [extrato, setExtrato] = useState<Transacao[]>([])
  const [periodo, setPeriodo] = useState<'7' | '15' | '30'>('30')

  useEffect(() => {
    loadDadosFinanceiros()
  }, [periodo])

  const loadDadosFinanceiros = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // 1. Pega dados da loja (comissão)
    const { data: loja } = await supabase
      .from('lojas')
      .select('id, comissao_plataforma')
      .eq('user_id', user.id)
      .single()

    if (loja) {
      // Define data de corte
      const dataCorte = new Date()
      dataCorte.setDate(dataCorte.getDate() - parseInt(periodo))
      
      // 2. Busca pedidos concluídos (entregues)
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', loja.id)
        .eq('status', 'entregue') // Só conta dinheiro de pedido entregue
        .gte('created_at', dataCorte.toISOString())
        .order('created_at', { ascending: false })

      if (pedidos) {
        let bruto = 0
        let comissaoTotal = 0
        const listaTransacoes: Transacao[] = []
        const taxaComissao = (loja.comissao_plataforma || 10) / 100 // Padrão 10% se não tiver

        pedidos.forEach(p => {
          // Entrada: Valor do Pedido
          bruto += p.total
          listaTransacoes.push({
            id: p.id,
            data: p.created_at,
            tipo: 'entrada',
            descricao: `Pedido #${p.id} (${p.forma_pagamento})`,
            valor: p.total,
            status: 'Concluído'
          })

          // Saída: Comissão da Plataforma
          const valorComissao = p.total * taxaComissao
          comissaoTotal += valorComissao
          listaTransacoes.push({
            id: p.id * 1000, // ID virtual para não conflitar
            data: p.created_at,
            tipo: 'saida',
            descricao: `Comissão PedeAí (${(taxaComissao * 100).toFixed(0)}%)`,
            valor: -valorComissao,
            status: 'Debitado'
          })
        })

        setResumo({
          saldoDisponivel: bruto - comissaoTotal, // Simplificação: tudo disponível
          aReceber: 0, // Futuro: separar cartões que caem em D+30
          totalVendido: bruto,
          totalComissoes: comissaoTotal
        })

        setExtrato(listaTransacoes)
      }
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando finanças...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
          <div>
            <h1 className="text-3xl font-bold text-white">Financeiro</h1>
            <p className="text-gray-400 text-sm">Acompanhe seus recebimentos</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 shadow-lg">
            <p className="text-gray-400 text-sm mb-1">Saldo Líquido (Estimado)</p>
            <h3 className="text-3xl font-bold text-green-400">R$ {resumo.saldoDisponivel.toFixed(2)}</h3>
            <p className="text-xs text-gray-500 mt-2">Já descontadas as taxas</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
            <p className="text-gray-400 text-sm mb-1">Vendas Brutas</p>
            <h3 className="text-3xl font-bold text-white">R$ {resumo.totalVendido.toFixed(2)}</h3>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setPeriodo('7')} className={`text-xs px-2 py-1 rounded ${periodo === '7' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>7d</button>
              <button onClick={() => setPeriodo('15')} className={`text-xs px-2 py-1 rounded ${periodo === '15' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>15d</button>
              <button onClick={() => setPeriodo('30')} className={`text-xs px-2 py-1 rounded ${periodo === '30' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>30d</button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-red-500 shadow-lg">
            <p className="text-gray-400 text-sm mb-1">Taxas e Comissões</p>
            <h3 className="text-3xl font-bold text-red-400">- R$ {resumo.totalComissoes.toFixed(2)}</h3>
            <p className="text-xs text-gray-500 mt-2">Taxa de serviço da plataforma</p>
          </div>
        </div>

        {/* Tabela de Extrato */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
            <h3 className="font-bold text-white">Extrato de Lançamentos</h3>
            <button className="text-xs text-blue-400 hover:underline">Exportar PDF (Em breve)</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {extrato.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma movimentação neste período.</td>
                  </tr>
                ) : (
                  extrato.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-gray-300">
                        {new Date(item.data).toLocaleDateString()} <span className="text-gray-500 text-xs">{new Date(item.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4 text-white font-medium">
                        {item.descricao}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${item.tipo === 'entrada' ? 'bg-green-500/10 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                        {item.tipo === 'entrada' ? '+' : ''} R$ {item.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>* Este é um extrato gerencial. Os repasses reais dependem do processamento do gateway de pagamento.</p>
        </div>

      </div>
    </div>
  )
}