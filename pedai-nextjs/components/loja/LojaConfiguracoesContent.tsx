'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Bairro {
  id: number
  nome_bairro: string
  taxa_entrega: number
  prazo_minutos: number
  ativo: boolean
}

// Interface flexível para permitir digitação livre
interface FormData {
  nome_loja: string
  descricao: string
  telefone: string
  endereco: string
  url_imagem: string
  url_capa: string
  aberta: boolean
  tempo_entrega_min: number | string // Permite string para limpar o campo
  taxa_entrega: number | string
  pedido_minimo: number | string
}

export default function LojaConfiguracoesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'entrega' | 'operacao'>('dados')
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  // Uploads
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)

  // Dados Gerais (Inicializados como strings vazias ou valores padrão)
  const [formData, setFormData] = useState<FormData>({
    nome_loja: '',
    descricao: '',
    telefone: '',
    endereco: '',
    url_imagem: '',
    url_capa: '',
    aberta: false,
    tempo_entrega_min: 30,
    taxa_entrega: 5.00,
    pedido_minimo: 0.00,
  })

  // Lista de Bairros
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [novoBairro, setNovoBairro] = useState({ nome: '', taxa: '', prazo: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: loja } = await supabase
      .from('lojas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (loja) {
      setLojaId(loja.id)
      setFormData({
        nome_loja: loja.nome_loja || '',
        descricao: loja.descricao || '',
        telefone: loja.telefone || '',
        endereco: loja.endereco || '',
        url_imagem: loja.url_imagem || '',
        url_capa: loja.url_capa || '',
        aberta: loja.aberta ?? false,
        // Se vier nulo do banco, usa vazio ou 0
        tempo_entrega_min: loja.tempo_entrega_min ?? 30,
        taxa_entrega: loja.taxa_entrega ?? 0,
        pedido_minimo: loja.pedido_minimo ?? 0,
      })
      loadBairros(loja.id)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  const loadBairros = async (id: number) => {
    const supabase = createClient()
    const { data } = await supabase.from('loja_bairros').select('*').eq('loja_id', id).order('nome_bairro')
    if (data) setBairros(data)
  }

  // --- FUNÇÕES DE BAIRROS ---
  const addBairro = async () => {
    if (!novoBairro.nome || !novoBairro.taxa || !lojaId) return alert('Preencha nome e taxa')
    
    const supabase = createClient()
    const { error } = await supabase.from('loja_bairros').insert({
      loja_id: lojaId,
      nome_bairro: novoBairro.nome,
      taxa_entrega: parseFloat(novoBairro.taxa.replace(',', '.')), // Corrige vírgula
      prazo_minutos: novoBairro.prazo ? parseInt(novoBairro.prazo) : Number(formData.tempo_entrega_min) || 30
    })

    if (error) alert('Erro: ' + error.message)
    else {
      setNovoBairro({ nome: '', taxa: '', prazo: '' })
      loadBairros(lojaId)
    }
  }

  const deleteBairro = async (id: number) => {
    // Removido confirm() conforme solicitado anteriormente
    const supabase = createClient()
    const { error } = await supabase.from('loja_bairros').delete().eq('id', id)
    
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      loadBairros(lojaId!)
    }
  }

  // --- UPLOAD ---
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'url_imagem' | 'url_capa') => {
    const isLogo = field === 'url_imagem'
    try {
      if (isLogo) setUploadingLogo(true); else setUploadingCapa(true)
      const file = event.target.files?.[0]
      if (!file || !lojaId) return

      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${lojaId}-${field}-${Math.random()}.${fileExt}`

      const { error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error

      const { data } = supabase.storage.from('images').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, [field]: data.publicUrl }))
      
      // Salva URL imediatamente no banco
      await supabase.from('lojas').update({ [field]: data.publicUrl }).eq('id', lojaId)

    } catch (error: any) {
      alert('Erro no upload: ' + error.message)
    } finally {
      if (isLogo) setUploadingLogo(false); else setUploadingCapa(false)
    }
  }

  // --- SALVAR GERAL ---
  const handleSave = async () => {
    if (!lojaId) return
    setSaving(true)
    const supabase = createClient()
    
    // Converte strings para números antes de enviar para o banco
    // Se estiver vazio ou inválido, envia 0 ou null
    const updates = {
      ...formData,
      tempo_entrega_min: Number(formData.tempo_entrega_min) || 0,
      taxa_entrega: Number(formData.taxa_entrega) || 0,
      pedido_minimo: Number(formData.pedido_minimo) || 0,
    }

    const { error } = await supabase.from('lojas').update(updates).eq('id', lojaId)
    setSaving(false)
    
    if (error) alert('Erro ao salvar: ' + error.message)
    else alert('Configurações salvas com sucesso!')
  }

  const toggleLoja = async () => {
    if (!lojaId) return
    const novoStatus = !formData.aberta
    const supabase = createClient()
    await supabase.from('lojas').update({ aberta: novoStatus }).eq('id', lojaId)
    setFormData({ ...formData, aberta: novoStatus })
  }

  // Handler genérico para inputs numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  if (loading) return <div className="text-white p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
          </div>
          {/* Botão de status removido daqui (está no Header) */}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-1 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('dados')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'dados' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Dados & Visual</button>
          <button type="button" onClick={() => setActiveTab('entrega')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'entrega' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Entrega & Bairros</button>
          <button type="button" onClick={() => setActiveTab('operacao')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'operacao' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Operação</button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          
          {/* ABA 1: DADOS & VISUAL */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Identidade Visual</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Logo (Quadrada)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 relative shrink-0">
                      {formData.url_imagem ? <img src={formData.url_imagem} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl">📸</span>}
                      {uploadingLogo && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">⌛</div>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_imagem')} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                  </div>
                </div>
                {/* Capa */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Capa (Retangular)</label>
                  <div className="flex flex-col gap-2">
                    <div className="w-full h-24 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 relative">
                      {formData.url_capa ? <img src={formData.url_capa} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full">Banner</span>}
                      {uploadingCapa && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">⌛</div>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_capa')} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mt-8">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Nome da Loja</label>
                  <input value={formData.nome_loja} onChange={e => setFormData({...formData, nome_loja: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Descrição / Slogan</label>
                  <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 h-20 resize-none focus:border-primary outline-none" maxLength={200} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Telefone</label>
                    <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Endereço</label>
                    <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: ENTREGA & BAIRROS */}
          {activeTab === 'entrega' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Configuração Padrão</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Taxa Base (R$)</label>
                  <input 
                    type="number" 
                    step="0.50" 
                    value={formData.taxa_entrega} 
                    onChange={(e) => handleNumberChange(e, 'taxa_entrega')} 
                    className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Tempo Médio (min)</label>
                  <input 
                    type="number" 
                    value={formData.tempo_entrega_min} 
                    onChange={(e) => handleNumberChange(e, 'tempo_entrega_min')} 
                    className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Pedido Mínimo (R$)</label>
                  <input 
                    type="number" 
                    step="1.00" 
                    value={formData.pedido_minimo} 
                    onChange={(e) => handleNumberChange(e, 'pedido_minimo')} 
                    className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" 
                  />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mt-8">Taxas por Bairro / Região</h3>
              <p className="text-sm text-gray-400 mb-4">Cadastre os bairros que você atende e a taxa específica para cada um.</p>

              {/* Form Novo Bairro */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500">Nome do Bairro</label>
                  <input placeholder="Ex: Centro" value={novoBairro.nome} onChange={e => setNovoBairro({...novoBairro, nome: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">Taxa (R$)</label>
                  <input type="number" placeholder="0.00" value={novoBairro.taxa} onChange={e => setNovoBairro({...novoBairro, taxa: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">Prazo (min)</label>
                  <input type="number" placeholder="30" value={novoBairro.prazo} onChange={e => setNovoBairro({...novoBairro, prazo: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
                <button 
                  type="button"
                  onClick={addBairro} 
                  className="bg-primary text-secondary font-bold px-4 py-2 rounded text-sm hover:opacity-90 h-[38px]"
                >
                  + Adicionar
                </button>
              </div>

              {/* Lista de Bairros */}
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
                {bairros.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nenhum bairro cadastrado. Usando taxa padrão.</p>}
                {bairros.map(b => (
                  <div key={b.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-gray-700">
                    <span className="text-white font-medium">{b.nome_bairro}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">{b.prazo_minutos} min</span>
                      <span className="text-green-400 font-bold">R$ {b.taxa_entrega.toFixed(2)}</span>
                      <button 
                        type="button" 
                        onClick={() => deleteBairro(b.id)} 
                        className="text-red-500 hover:text-red-400 p-2 hover:bg-gray-800 rounded transition-colors" 
                        title="Remover Bairro"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: OPERAÇÃO */}
          {activeTab === 'operacao' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Status da Loja</h3>
              <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-600">
                <div>
                  <h4 className="text-white font-bold">Abrir/Fechar Loja Manualmente</h4>
                  <p className="text-sm text-gray-400">Use isso para pausas emergenciais. O botão de status também fica no topo da página.</p>
                </div>
                <button 
                  type="button"
                  onClick={toggleLoja} 
                  className={`px-6 py-2 rounded font-bold text-white ${formData.aberta ? 'bg-red-600' : 'bg-green-600'}`}
                >
                  {formData.aberta ? 'FECHAR AGORA' : 'ABRIR AGORA'}
                </button>
              </div>
              <p className="text-gray-500 text-sm text-center mt-8">Configuração de horários automáticos em breve.</p>
            </div>
          )}

        </div>

        {/* RODAPÉ FIXO: SALVAR */}
        <div className="mt-6 flex justify-end">
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary text-secondary font-bold py-3 px-8 rounded-lg hover:opacity-90 shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </div>
    </div>
  )
}