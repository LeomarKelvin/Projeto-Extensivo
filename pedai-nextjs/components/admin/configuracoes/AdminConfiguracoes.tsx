'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ConfigGeral {
  taxa_entrega_padrao: number
  comissao_plataforma_padrao: number
  pedido_minimo_padrao: number
}

interface ConfigMunicipio {
  municipio: string
  taxa_entrega: number | null
  comissao_plataforma: number | null
  pedido_minimo: number | null
  raio_entrega_km: number | null
}

interface Cupom {
  id: number
  codigo: string
  tipo: 'percentual' | 'valor_fixo'
  valor: number
  minimo_pedido: number | null
  validade: string | null
  ativo: boolean
  municipio: string | null
}

export default function AdminConfiguracoes() {
  const [activeTab, setActiveTab] = useState<'geral' | 'municipios' | 'cupons'>('geral')
  const [loading, setLoading] = useState(true)
  
  const [configGeral, setConfigGeral] = useState<ConfigGeral>({
    taxa_entrega_padrao: 5.00,
    comissao_plataforma_padrao: 10,
    pedido_minimo_padrao: 15.00
  })

  const [configsMunicipio, setConfigsMunicipio] = useState<ConfigMunicipio[]>([
    { municipio: 'Alagoa Nova', taxa_entrega: null, comissao_plataforma: null, pedido_minimo: null, raio_entrega_km: null },
    { municipio: 'Esperança', taxa_entrega: null, comissao_plataforma: null, pedido_minimo: null, raio_entrega_km: null },
    { municipio: 'Lagoa Seca', taxa_entrega: null, comissao_plataforma: null, pedido_minimo: null, raio_entrega_km: null }
  ])

  const [cupons, setCupons] = useState<Cupom[]>([])
  const [showCupomModal, setShowCupomModal] = useState(false)
  const [editingCupom, setEditingCupom] = useState<Cupom | null>(null)
  const [cupomForm, setCupomForm] = useState({
    codigo: '',
    tipo: 'percentual' as 'percentual' | 'valor_fixo',
    valor: '',
    minimo_pedido: '',
    validade: '',
    municipio: ''
  })

  useEffect(() => {
    loadConfiguracoes()
  }, [])

  const loadConfiguracoes = async () => {
    setCupons([
      {
        id: 1,
        codigo: 'BEMVINDO10',
        tipo: 'percentual',
        valor: 10,
        minimo_pedido: 20,
        validade: '2025-12-31',
        ativo: true,
        municipio: null
      },
      {
        id: 2,
        codigo: 'FRETE5',
        tipo: 'valor_fixo',
        valor: 5,
        minimo_pedido: null,
        validade: null,
        ativo: true,
        municipio: 'Alagoa Nova'
      }
    ])
    
    setLoading(false)
  }

  const handleSaveGeral = () => {
    alert('Configurações gerais salvas com sucesso!')
  }

  const handleSaveMunicipio = (municipio: string) => {
    alert(`Configurações de ${municipio} salvas com sucesso!`)
  }

  const handleCreateCupom = () => {
    setEditingCupom(null)
    setCupomForm({
      codigo: '',
      tipo: 'percentual',
      valor: '',
      minimo_pedido: '',
      validade: '',
      municipio: ''
    })
    setShowCupomModal(true)
  }

  const handleEditCupom = (cupom: Cupom) => {
    setEditingCupom(cupom)
    setCupomForm({
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: cupom.valor.toString(),
      minimo_pedido: cupom.minimo_pedido?.toString() || '',
      validade: cupom.validade || '',
      municipio: cupom.municipio || ''
    })
    setShowCupomModal(true)
  }

  const handleSaveCupom = () => {
    if (!cupomForm.codigo || !cupomForm.valor) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    if (editingCupom) {
      alert(`Cupom ${cupomForm.codigo} atualizado com sucesso!`)
    } else {
      alert(`Cupom ${cupomForm.codigo} criado com sucesso!`)
    }
    
    setShowCupomModal(false)
    loadConfiguracoes()
  }

  const handleToggleCupom = (cupom: Cupom) => {
    alert(`Cupom ${cupom.codigo} ${cupom.ativo ? 'desativado' : 'ativado'} com sucesso!`)
    loadConfiguracoes()
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
      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'geral'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Configurações Gerais
          </button>
          <button
            onClick={() => setActiveTab('municipios')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'municipios'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Por Município
          </button>
          <button
            onClick={() => setActiveTab('cupons')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
              activeTab === 'cupons'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Cupons de Desconto
          </button>
        </div>
      </div>

      {/* Tab: Geral */}
      {activeTab === 'geral' && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Configurações Padrão da Plataforma</h3>
          
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taxa de Entrega Padrão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={configGeral.taxa_entrega_padrao}
                onChange={(e) => setConfigGeral({ ...configGeral, taxa_entrega_padrao: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Valor padrão cobrado para entregas quando não especificado pela loja
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comissão da Plataforma Padrão (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={configGeral.comissao_plataforma_padrao}
                onChange={(e) => setConfigGeral({ ...configGeral, comissao_plataforma_padrao: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Percentual cobrado sobre cada pedido quando não especificado pela loja
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pedido Mínimo Padrão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={configGeral.pedido_minimo_padrao}
                onChange={(e) => setConfigGeral({ ...configGeral, pedido_minimo_padrao: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Valor mínimo para realizar pedidos quando não especificado pela loja
              </p>
            </div>

            <button
              onClick={handleSaveGeral}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium"
            >
              Salvar Configurações Gerais
            </button>
          </div>
        </div>
      )}

      {/* Tab: Municípios */}
      {activeTab === 'municipios' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">Configurações Por Município</h3>
            <p className="text-sm text-gray-400 mb-6">
              Configure valores específicos para cada município. Deixe vazio para usar os valores padrão.
            </p>
          </div>

          {configsMunicipio.map((config, index) => (
            <div key={config.municipio} className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h4 className="text-lg font-bold text-white mb-4">{config.municipio}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Taxa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.taxa_entrega || ''}
                    onChange={(e) => {
                      const newConfigs = [...configsMunicipio]
                      newConfigs[index].taxa_entrega = e.target.value ? parseFloat(e.target.value) : null
                      setConfigsMunicipio(newConfigs)
                    }}
                    placeholder="Usar padrão"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Comissão (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.comissao_plataforma || ''}
                    onChange={(e) => {
                      const newConfigs = [...configsMunicipio]
                      newConfigs[index].comissao_plataforma = e.target.value ? parseFloat(e.target.value) : null
                      setConfigsMunicipio(newConfigs)
                    }}
                    placeholder="Usar padrão"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.pedido_minimo || ''}
                    onChange={(e) => {
                      const newConfigs = [...configsMunicipio]
                      newConfigs[index].pedido_minimo = e.target.value ? parseFloat(e.target.value) : null
                      setConfigsMunicipio(newConfigs)
                    }}
                    placeholder="Usar padrão"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Raio de Entrega (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.raio_entrega_km || ''}
                    onChange={(e) => {
                      const newConfigs = [...configsMunicipio]
                      newConfigs[index].raio_entrega_km = e.target.value ? parseFloat(e.target.value) : null
                      setConfigsMunicipio(newConfigs)
                    }}
                    placeholder="Sem limite"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSaveMunicipio(config.municipio)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Salvar {config.municipio}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Cupons */}
      {activeTab === 'cupons' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Cupons de Desconto</h3>
                <p className="text-sm text-gray-400">
                  Gerencie os cupons promocionais da plataforma
                </p>
              </div>
              <button
                onClick={handleCreateCupom}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Criar Cupom</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Desconto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mínimo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Validade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Município</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {cupons.map((cupom) => (
                  <tr key={cupom.id} className="hover:bg-gray-700 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{cupom.codigo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {cupom.tipo === 'percentual' ? 'Percentual' : 'Valor Fixo'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-400">
                        {cupom.tipo === 'percentual' ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {cupom.minimo_pedido ? `R$ ${cupom.minimo_pedido.toFixed(2)}` : 'Sem mínimo'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {cupom.validade ? new Date(cupom.validade).toLocaleDateString('pt-BR') : 'Sem validade'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {cupom.municipio || 'Todos'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cupom.ativo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {cupom.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCupom(cupom)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleCupom(cupom)}
                          className={`${
                            cupom.ativo 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white px-3 py-1 rounded transition`}
                        >
                          {cupom.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cupons.length === 0 && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-400 text-lg">Nenhum cupom cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Cupom Modal */}
      {showCupomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingCupom ? 'Editar Cupom' : 'Criar Novo Cupom'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={cupomForm.codigo}
                  onChange={(e) => setCupomForm({ ...cupomForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: BEMVINDO10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Desconto *
                </label>
                <select
                  value={cupomForm.tipo}
                  onChange={(e) => setCupomForm({ ...cupomForm, tipo: e.target.value as 'percentual' | 'valor_fixo' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="valor_fixo">Valor Fixo (R$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do Desconto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cupomForm.valor}
                  onChange={(e) => setCupomForm({ ...cupomForm, valor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={cupomForm.tipo === 'percentual' ? 'Ex: 10' : 'Ex: 5.00'}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {cupomForm.tipo === 'percentual' ? 'Percentual de desconto' : 'Valor em reais'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor Mínimo do Pedido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cupomForm.minimo_pedido}
                  onChange={(e) => setCupomForm({ ...cupomForm, minimo_pedido: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={cupomForm.validade}
                  onChange={(e) => setCupomForm({ ...cupomForm, validade: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Município Específico
                </label>
                <select
                  value={cupomForm.municipio}
                  onChange={(e) => setCupomForm({ ...cupomForm, municipio: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os municípios</option>
                  <option value="Alagoa Nova">Alagoa Nova</option>
                  <option value="Esperança">Esperança</option>
                  <option value="Lagoa Seca">Lagoa Seca</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveCupom}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                {editingCupom ? 'Salvar Alterações' : 'Criar Cupom'}
              </button>
              <button
                onClick={() => setShowCupomModal(false)}
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
