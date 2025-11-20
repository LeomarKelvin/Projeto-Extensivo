'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Entregador {
  id: number
  nome: string
  telefone: string
  veiculo: 'moto' | 'carro' | 'bicicleta' | 'pe'
  placa?: string
  documento?: string
  valor_diaria?: number
  ativo: boolean
}

export default function LojaCadastroEntregadores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [entregadores, setEntregadores] = useState<Entregador[]>([])
  
  // Modais
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false) // Novo Modal
  
  const [lojaId, setLojaId] = useState<number | null>(null)
  const [idToDelete, setIdToDelete] = useState<number | null>(null) // ID para deletar
  
  const [formData, setFormData] = useState<Partial<Entregador>>({
    nome: '',
    telefone: '',
    veiculo: 'moto',
    placa: '',
    documento: '',
    valor_diaria: 0,
    ativo: true
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Funções de Formatação
  const formatarTelefone = (valor: string) => {
    return valor.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15)
  }

  const formatarDocumento = (valor: string) => {
    const n = valor.replace(/\D/g, '')
    return n.length <= 9 
      ? n.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3') 
      : n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  }

  const handleChange = (campo: string, valor: string) => {
    let valorFormatado = valor
    if (campo === 'telefone') valorFormatado = formatarTelefone(valor)
    else if (campo === 'documento') valorFormatado = formatarDocumento(valor)
    setFormData(prev => ({ ...prev, [campo]: valorFormatado }))
  }

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: loja } = await supabase.from('lojas').select('id').eq('user_id', user.id).single()

    if (loja) {
      setLojaId(loja.id)
      const { data: lista } = await supabase.from('entregadores_detalhes').select('*').eq('loja_id', loja.id).order('nome')
      if (lista) setEntregadores(lista)
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    const supabase = createClient()
    const payload = { loja_id: lojaId, ...formData, valor_diaria: Number(formData.valor_diaria) }

    let error
    if (editingId) {
      const res = await supabase.from('entregadores_detalhes').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('entregadores_detalhes').insert(payload)
      error = res.error
    }

    if (error) alert('Erro ao salvar: ' + error.message)
    else {
      setShowModal(false)
      resetForm()
      loadData()
    }
  }

  // 1. Clicou na lixeira (Só abre o modal)
  const requestDelete = (id: number) => {
    setIdToDelete(id)
    setShowDeleteModal(true)
  }

  // 2. Confirmou no Modal (Executa a exclusão)
  const confirmDelete = async () => {
    if (!idToDelete) return
    
    const supabase = createClient()
    const { error } = await supabase.from('entregadores_detalhes').delete().eq('id', idToDelete)
    
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      loadData()
      setShowDeleteModal(false)
      setIdToDelete(null)
    }
  }

  const openEdit = (entregador: Entregador) => {
    setFormData(entregador)
    setEditingId(entregador.id)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ nome: '', telefone: '', veiculo: 'moto', placa: '', documento: '', valor_diaria: 0, ativo: true })
    setEditingId(null)
  }

  if (loading) return <div className="p-8 text-white">Carregando...</div>

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl transition-colors">←</button>
          <div>
            <h1 className="text-3xl font-bold text-white">Entregadores</h1>
            <p className="text-gray-400 text-sm">Gerencie sua frota própria</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-tenant-primary text-tenant-secondary px-6 py-3 rounded-lg font-bold hover:opacity-90">
          + Novo Entregador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entregadores.map(ent => (
          <div key={ent.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">{ent.nome}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${ent.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {ent.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="text-2xl">
                {ent.veiculo === 'moto' && '🏍️'}
                {ent.veiculo === 'carro' && '🚗'}
                {ent.veiculo === 'bicicleta' && '🚲'}
                {ent.veiculo === 'pe' && '🚶'}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>📱 {ent.telefone}</p>
              {ent.placa && <p>🪪 Placa: {ent.placa}</p>}
              {ent.documento && <p>🆔 Doc: {ent.documento}</p>}
              <p>💰 Diária: R$ {ent.valor_diaria?.toFixed(2)}</p>
            </div>

            <div className="mt-6 flex gap-2 pt-4 border-t border-gray-700">
              <button onClick={() => openEdit(ent)} className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition-colors">Editar</button>
              <button onClick={() => requestDelete(ent.id)} className="px-4 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors" title="Excluir">🗑️</button>
            </div>
          </div>
        ))}
        {entregadores.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">Nenhum entregador cadastrado.</div>
        )}
      </div>

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar' : 'Novo'} Entregador</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Nome *</label>
                  <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Telefone *</label>
                  <input required value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} maxLength={15} placeholder="(00) 9 0000-0000" className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Veículo</label>
                  <select value={formData.veiculo} onChange={e => setFormData({...formData, veiculo: e.target.value as any})} className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none">
                    <option value="moto">Moto</option><option value="carro">Carro</option><option value="bicicleta">Bicicleta</option><option value="pe">A Pé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Placa</label>
                  <input value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})} className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Documento (CPF/RG)</label>
                  <input value={formData.documento} onChange={e => handleChange('documento', e.target.value)} maxLength={14} placeholder="000.000.000-00" className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Valor Diária (R$)</label>
                  <input type="number" step="0.01" value={formData.valor_diaria} onChange={e => setFormData({...formData, valor_diaria: parseFloat(e.target.value)})} className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-tenant-primary outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="ativo" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-5 h-5 rounded bg-gray-900 border-gray-600 text-tenant-primary focus:ring-0" />
                <label htmlFor="ativo" className="text-white">Entregador Ativo</label>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-tenant-primary text-tenant-secondary font-bold rounded-lg hover:opacity-90">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVO MODAL DE EXCLUSÃO (BONITO) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗑️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Entregador?</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Essa ação é irreversível. O histórico deste entregador será mantido nos pedidos, mas ele será removido da lista.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}