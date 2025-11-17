'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Loja {
  id: number
  nome_loja: string
  municipio: string
  categoria: string
  aprovada: boolean
  aberta: boolean
  taxa_entrega: number | null
  comissao_plataforma: number | null
  horario_abertura: string | null
  horario_fechamento: string | null
  raio_entrega_km: number | null
}

export default function AdminLojas() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [filteredLojas, setFilteredLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filterMunicipio, setFilterMunicipio] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterAprovacao, setFilterAprovacao] = useState('todos')
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [editForm, setEditForm] = useState({
    taxa_entrega: '',
    comissao_plataforma: '',
    horario_abertura: '',
    horario_fechamento: '',
    raio_entrega_km: ''
  })

  const categorias = ['Restaurante', 'Lanchonete', 'Pizzaria', 'Padaria', 'Açaí', 'Mercado', 'Farmácia', 'Outros']
  const municipios = ['Alagoa Nova', 'Esperança', 'Lagoa Seca']

  useEffect(() => {
    loadLojas()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [lojas, filterMunicipio, filterCategoria, filterAprovacao])

  const loadLojas = async () => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('lojas')
      .select('*')
      .order('municipio')
      .order('nome_loja')

    if (data) {
      setLojas(data)
    }
    
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...lojas]
    
    if (filterMunicipio !== 'todos') {
      filtered = filtered.filter(l => l.municipio === filterMunicipio)
    }
    
    if (filterCategoria !== 'todos') {
      filtered = filtered.filter(l => l.categoria === filterCategoria)
    }
    
    if (filterAprovacao === 'pendentes') {
      filtered = filtered.filter(l => !l.aprovada)
    } else if (filterAprovacao === 'aprovadas') {
      filtered = filtered.filter(l => l.aprovada)
    }
    
    setFilteredLojas(filtered)
  }

  const handleAprovar = async (loja: Loja) => {
    if (confirm(`Aprovar a loja ${loja.nome_loja}?`)) {
      const supabase = createClient()
      
      await supabase
        .from('lojas')
        .update({ aprovada: true })
        .eq('id', loja.id)
      
      loadLojas()
    }
  }

  const handleReprovar = async (loja: Loja) => {
    if (confirm(`Reprovar a loja ${loja.nome_loja}? Isso pode desativá-la.`)) {
      const supabase = createClient()
      
      await supabase
        .from('lojas')
        .update({ aprovada: false })
        .eq('id', loja.id)
      
      loadLojas()
    }
  }

  const handleEdit = (loja: Loja) => {
    setSelectedLoja(loja)
    setEditForm({
      taxa_entrega: loja.taxa_entrega?.toString() || '',
      comissao_plataforma: loja.comissao_plataforma?.toString() || '',
      horario_abertura: loja.horario_abertura || '',
      horario_fechamento: loja.horario_fechamento || '',
      raio_entrega_km: loja.raio_entrega_km?.toString() || ''
    })
    setShowEditModal(true)
  }

  const confirmEdit = async () => {
    if (!selectedLoja) return
    
    const supabase = createClient()
    
    await supabase
      .from('lojas')
      .update({
        taxa_entrega: editForm.taxa_entrega ? parseFloat(editForm.taxa_entrega) : null,
        comissao_plataforma: editForm.comissao_plataforma ? parseFloat(editForm.comissao_plataforma) : null,
        horario_abertura: editForm.horario_abertura || null,
        horario_fechamento: editForm.horario_fechamento || null,
        raio_entrega_km: editForm.raio_entrega_km ? parseFloat(editForm.raio_entrega_km) : null
      })
      .eq('id', selectedLoja.id)
    
    setShowEditModal(false)
    setSelectedLoja(null)
    loadLojas()
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
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Município</label>
            <select
              value={filterMunicipio}
              onChange={(e) => setFilterMunicipio(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {municipios.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status de Aprovação</label>
            <select
              value={filterAprovacao}
              onChange={(e) => setFilterAprovacao(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas</option>
              <option value="pendentes">Pendentes</option>
              <option value="aprovadas">Aprovadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Total de Lojas</p>
          <p className="text-2xl font-bold text-white">{lojas.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Aprovadas</p>
          <p className="text-2xl font-bold text-green-500">{lojas.filter(l => l.aprovada).length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-500">{lojas.filter(l => !l.aprovada).length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Abertas Agora</p>
          <p className="text-2xl font-bold text-blue-500">{lojas.filter(l => l.aberta).length}</p>
        </div>
      </div>

      {/* Lojas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLojas.map((loja) => (
          <div
            key={loja.id}
            className={`bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition ${
              !loja.aprovada ? 'border-2 border-yellow-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{loja.nome_loja}</h3>
                <p className="text-sm text-gray-400">{loja.municipio}</p>
              </div>
              
              {!loja.aprovada && (
                <span className="px-2 py-1 text-xs font-semibold bg-yellow-500 text-gray-900 rounded-full">
                  Pendente
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Categoria:</span>
                <span className="text-white font-medium">{loja.categoria}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                {loja.aberta ? (
                  <span className="text-green-500 font-medium">Aberta</span>
                ) : (
                  <span className="text-red-500 font-medium">Fechada</span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Taxa Entrega:</span>
                <span className="text-white font-medium">
                  {loja.taxa_entrega ? `R$ ${loja.taxa_entrega.toFixed(2)}` : 'Padrão'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Comissão:</span>
                <span className="text-white font-medium">
                  {loja.comissao_plataforma ? `${loja.comissao_plataforma}%` : 'Padrão'}
                </span>
              </div>
              
              {loja.horario_abertura && loja.horario_fechamento && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Horário:</span>
                  <span className="text-white font-medium">
                    {loja.horario_abertura} - {loja.horario_fechamento}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!loja.aprovada && (
                <>
                  <button
                    onClick={() => handleAprovar(loja)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition text-sm font-medium"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReprovar(loja)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition text-sm font-medium"
                  >
                    Reprovar
                  </button>
                </>
              )}
              
              <button
                onClick={() => handleEdit(loja)}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition text-sm font-medium"
              >
                Configurar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLojas.length === 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhuma loja encontrada com os filtros selecionados.</p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLoja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Configurar Loja: {selectedLoja.nome_loja}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Taxa de Entrega (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.taxa_entrega}
                  onChange={(e) => setEditForm({ ...editForm, taxa_entrega: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: 5.00"
                />
                <p className="text-xs text-gray-400 mt-1">Deixe vazio para usar valor padrão</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comissão da Plataforma (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.comissao_plataforma}
                  onChange={(e) => setEditForm({ ...editForm, comissao_plataforma: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: 10"
                />
                <p className="text-xs text-gray-400 mt-1">Deixe vazio para usar valor padrão</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Horário de Abertura
                </label>
                <input
                  type="time"
                  value={editForm.horario_abertura}
                  onChange={(e) => setEditForm({ ...editForm, horario_abertura: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Horário de Fechamento
                </label>
                <input
                  type="time"
                  value={editForm.horario_fechamento}
                  onChange={(e) => setEditForm({ ...editForm, horario_fechamento: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raio de Entrega (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.raio_entrega_km}
                  onChange={(e) => setEditForm({ ...editForm, raio_entrega_km: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: 5.0"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={confirmEdit}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Salvar Alterações
              </button>
              <button
                onClick={() => setShowEditModal(false)}
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
