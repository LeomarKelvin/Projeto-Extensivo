'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Repasse {
  id: number
  loja_id: number
  loja_nome: string
  periodo_inicio: string
  periodo_fim: string
  valor_bruto: number
  comissao: number
  valor_liquido: number
  status: 'pendente' | 'processando' | 'pago'
}

interface FinancialStats {
  receitaTotal: number
  comissoesTotais: number
  repassesPendentes: number
  pedidosTotal: number
}

export default function AdminFinanceiro() {
  const [stats, setStats] = useState<FinancialStats>({
    receitaTotal: 0,
    comissoesTotais: 0,
    repassesPendentes: 0,
    pedidosTotal: 0
  })
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [filteredRepasses, setFilteredRepasses] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filterLoja, setFilterLoja] = useState('todos')
  const [filterPeriodo, setFilterPeriodo] = useState('todos')
  
  const [lojas, setLojas] = useState<Array<{ id: number; nome_loja: string }>>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [repasses, filterLoja, filterPeriodo])

  const loadData = async () => {
    const supabase = createClient()
    
    const { data: lojasData } = await supabase
      .from('lojas')
      .select('id, nome_loja')
      .order('nome_loja')
    
    if (lojasData) {
      setLojas(lojasData)
    }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('total, loja_id, status, created_at')
      .not('status', 'eq', 'cancelado')

    let receitaTotal = 0
    let comissoesTotais = 0
    const repassesMap = new Map<number, { valor_bruto: number; pedidos: number }>()

    if (pedidos) {
      pedidos.forEach(pedido => {
        receitaTotal += pedido.total || 0
        // Simulação da comissão (10%) - No futuro virá do Gateway
        const comissao = (pedido.total || 0) * 0.10
        comissoesTotais += comissao

        if (!repassesMap.has(pedido.loja_id)) {
          repassesMap.set(pedido.loja_id, { valor_bruto: 0, pedidos: 0 })
        }
        const current = repassesMap.get(pedido.loja_id)!
        current.valor_bruto += pedido.total || 0
        current.pedidos += 1
      })
    }

    const repassesData: Repasse[] = []
    let repassesPendentesTotal = 0

    repassesMap.forEach((data, lojaId) => {
      const loja = lojasData?.find(l => l.id === lojaId)
      if (loja) {
        const comissao = data.valor_bruto * 0.10
        const valor_liquido = data.valor_bruto - comissao
        
        repassesData.push({
          id: lojaId,
          loja_id: lojaId,
          loja_nome: loja.nome_loja,
          periodo_inicio: 'Mês Atual', // Placeholder para visualização
          periodo_fim: 'Mês Atual',
          valor_bruto: data.valor_bruto,
          comissao: comissao,
          valor_liquido: valor_liquido,
          status: 'pendente' // Status visual, aguardando integração do Gateway
        })
        
        repassesPendentesTotal += valor_liquido
      }
    })

    setStats({
      receitaTotal,
      comissoesTotais,
      repassesPendentes: repassesPendentesTotal,
      pedidosTotal: pedidos?.length || 0
    })

    setRepasses(repassesData)
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...repasses]
    
    if (filterLoja !== 'todos') {
      filtered = filtered.filter(r => r.loja_id.toString() === filterLoja)
    }
    
    setFilteredRepasses(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">GMV (Volume Total)</p>
              <p className="text-3xl font-bold text-white mt-2">
                R$ {stats.receitaTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-500 bg-opacity-50 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-3">{stats.pedidosTotal} pedidos transacionados</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Receita da Plataforma</p>
              <p className="text-3xl font-bold text-white mt-2">
                R$ {stats.comissoesTotais.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500 bg-opacity-50 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-green-100 mt-3">Baseado em 10% de comissão</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100">Valor das Lojas</p>
              <p className="text-3xl font-bold text-white mt-2">
                R$ {stats.repassesPendentes.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-500 bg-opacity-50 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-yellow-100 mt-3">Parte que cabe aos parceiros</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Lojas Ativas</p>
              <p className="text-3xl font-bold text-white mt-2">
                {lojas.length}
              </p>
            </div>
            <div className="bg-purple-500 bg-opacity-50 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-purple-100 mt-3">Parceiros gerando receita</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filtrar por Loja</label>
              <select
                value={filterLoja}
                onChange={(e) => setFilterLoja(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas as Lojas</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id.toString()}>{loja.nome_loja}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Mês Atual</option>
                <option value="anterior">Mês Anterior</option>
              </select>
            </div>
          </div>
          
          {/* Botão informativo apenas */}
          <div className="text-sm text-gray-400 italic pb-2">
            * Os repasses são processados automaticamente pelo Gateway de Pagamento.
          </div>
        </div>
      </div>

      {/* Repasses Table (VIEW ONLY) */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Venda Bruta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sua Comissão (10%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status Gateway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRepasses.map((repasse) => (
                <tr key={repasse.id} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{repasse.loja_nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {repasse.periodo_inicio}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">R$ {repasse.valor_bruto.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-400 font-bold">+ R$ {repasse.comissao.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-yellow-400">R$ {repasse.valor_liquido.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-600 text-gray-300">
                      Aguardando Integração
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRepasses.length === 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhuma movimentação financeira encontrada.</p>
        </div>
      )}
    </div>
  )
}