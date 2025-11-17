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
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPeriodo, setFilterPeriodo] = useState('todos')
  
  const [lojas, setLojas] = useState<Array<{ id: number; nome_loja: string }>>([])
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [selectedRepasse, setSelectedRepasse] = useState<Repasse | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [repasses, filterLoja, filterStatus, filterPeriodo])

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
          periodo_inicio: '2025-01-01',
          periodo_fim: '2025-01-31',
          valor_bruto: data.valor_bruto,
          comissao: comissao,
          valor_liquido: valor_liquido,
          status: 'pendente'
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
    
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }
    
    setFilteredRepasses(filtered)
  }

  const handleProcessar = (repasse: Repasse) => {
    setSelectedRepasse(repasse)
    setShowProcessModal(true)
  }

  const confirmProcessar = async () => {
    if (!selectedRepasse) return
    
    alert(`Pagamento processado para ${selectedRepasse.loja_nome}: R$ ${selectedRepasse.valor_liquido.toFixed(2)}`)
    
    setShowProcessModal(false)
    setSelectedRepasse(null)
  }

  const handleGerarNovoPeriodo = () => {
    alert('Função de gerar novo período de repasse será implementada.')
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
              <p className="text-sm text-blue-100">Receita Total</p>
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
          <p className="text-xs text-blue-100 mt-3">{stats.pedidosTotal} pedidos totais</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Comissões Totais</p>
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
          <p className="text-xs text-green-100 mt-3">Média de 10% por pedido</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100">Repasses Pendentes</p>
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
          <p className="text-xs text-yellow-100 mt-3">{repasses.filter(r => r.status === 'pendente').length} lojas aguardando</p>
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
          <p className="text-xs text-purple-100 mt-3">Lojas cadastradas</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="processando">Processando</option>
                <option value="pago">Pagos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Períodos</option>
                <option value="2025-01">Janeiro 2025</option>
                <option value="2024-12">Dezembro 2024</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGerarNovoPeriodo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Gerar Período</span>
          </button>
        </div>
      </div>

      {/* Repasses Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Bruto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comissão (10%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Líquido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
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
                      {new Date(repasse.periodo_inicio).toLocaleDateString('pt-BR')} - {new Date(repasse.periodo_fim).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">R$ {repasse.valor_bruto.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-400">- R$ {repasse.comissao.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-400">R$ {repasse.valor_liquido.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      repasse.status === 'pago' ? 'bg-green-600 text-white' :
                      repasse.status === 'processando' ? 'bg-blue-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {repasse.status === 'pago' ? 'Pago' :
                       repasse.status === 'processando' ? 'Processando' :
                       'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {repasse.status === 'pendente' && (
                      <button
                        onClick={() => handleProcessar(repasse)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition"
                      >
                        Processar
                      </button>
                    )}
                    {repasse.status === 'processando' && (
                      <span className="text-gray-400">Em processamento...</span>
                    )}
                    {repasse.status === 'pago' && (
                      <span className="text-green-400">✓ Concluído</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRepasses.length === 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhum repasse encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedRepasse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Processar Pagamento</h3>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Loja:</span>
                <span className="text-white font-medium">{selectedRepasse.loja_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Período:</span>
                <span className="text-white font-medium">
                  {new Date(selectedRepasse.periodo_inicio).toLocaleDateString('pt-BR')} - {new Date(selectedRepasse.periodo_fim).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor Bruto:</span>
                <span className="text-white font-medium">R$ {selectedRepasse.valor_bruto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Comissão:</span>
                <span className="text-red-400 font-medium">- R$ {selectedRepasse.comissao.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between">
                <span className="text-gray-300 font-semibold">Valor a Pagar:</span>
                <span className="text-green-400 font-bold text-lg">R$ {selectedRepasse.valor_liquido.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-yellow-400 text-sm mb-4">
              ⚠️ Esta ação marcará o repasse como processado. Confirme que o pagamento foi realizado.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmProcessar}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Confirmar Pagamento
              </button>
              <button
                onClick={() => setShowProcessModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
