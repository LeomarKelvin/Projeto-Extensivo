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

interface HorarioDia {
  dia: string
  ativo: boolean
  inicio: string
  fim: string
}

interface FormData {
  nome_loja: string
  descricao: string
  telefone: string
  endereco: string
  url_imagem: string
  url_capa: string
  aberta: boolean
  tempo_entrega_min: number | string
  taxa_entrega: number | string
  pedido_minimo: number | string
  aceita_dinheiro: boolean
  aceita_pix: boolean
  aceita_cartao: boolean
  // Novo campo persistente no banco
  tipo_horario: 'sempre_aberto' | 'dias_especificos' | 'agendado' | 'fechado'
  horarios_funcionamento: HorarioDia[]
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const HORARIO_PADRAO: HorarioDia[] = DIAS_SEMANA.map(dia => ({
  dia,
  ativo: true,
  inicio: '18:00',
  fim: '23:00'
}))

export default function LojaConfiguracoesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'entrega' | 'pagamento' | 'operacao'>('dados')
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)

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
    aceita_dinheiro: true,
    aceita_pix: true,
    aceita_cartao: true,
    tipo_horario: 'sempre_aberto',
    horarios_funcionamento: HORARIO_PADRAO
  })

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
        tempo_entrega_min: loja.tempo_entrega_min ?? 30,
        taxa_entrega: loja.taxa_entrega ?? 0,
        pedido_minimo: loja.pedido_minimo ?? 0,
        aceita_dinheiro: loja.aceita_dinheiro ?? true,
        aceita_pix: loja.aceita_pix ?? true,
        aceita_cartao: loja.aceita_cartao ?? true,
        // Carrega o tipo salvo ou padrão
        tipo_horario: loja.tipo_horario || 'sempre_aberto',
        horarios_funcionamento: loja.horarios_funcionamento || HORARIO_PADRAO
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

  const addBairro = async () => {
    if (!novoBairro.nome || !novoBairro.taxa || !lojaId) return alert('Preencha nome e taxa')
    
    const supabase = createClient()
    const { error } = await supabase.from('loja_bairros').insert({
      loja_id: lojaId,
      nome_bairro: novoBairro.nome,
      taxa_entrega: parseFloat(novoBairro.taxa.replace(',', '.')),
      prazo_minutos: novoBairro.prazo ? parseInt(novoBairro.prazo) : Number(formData.tempo_entrega_min) || 30
    })

    if (error) alert('Erro: ' + error.message)
    else {
      setNovoBairro({ nome: '', taxa: '', prazo: '' })
      loadBairros(lojaId)
    }
  }

  const deleteBairro = async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('loja_bairros').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else loadBairros(lojaId!)
  }

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
      await supabase.from('lojas').update({ [field]: data.publicUrl }).eq('id', lojaId)

    } catch (error: any) {
      alert('Erro no upload: ' + error.message)
    } finally {
      if (isLogo) setUploadingLogo(false); else setUploadingCapa(false)
    }
  }

  const handleSave = async () => {
    if (!lojaId) return
    setSaving(true)
    const supabase = createClient()
    
    const updates = {
      ...formData,
      tempo_entrega_min: Number(formData.tempo_entrega_min) || 0,
      taxa_entrega: Number(formData.taxa_entrega) || 0,
      pedido_minimo: Number(formData.pedido_minimo) || 0,
      // Salva o tipo e os horários
      tipo_horario: formData.tipo_horario,
      horarios_funcionamento: formData.horarios_funcionamento
    }

    const { error } = await supabase.from('lojas').update(updates).eq('id', lojaId)
    setSaving(false)
    
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const toggleLoja = async () => {
    if (!lojaId) return
    const novoStatus = !formData.aberta
    const supabase = createClient()
    await supabase.from('lojas').update({ aberta: novoStatus }).eq('id', lojaId)
    setFormData({ ...formData, aberta: novoStatus })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  const handleHorarioChange = (index: number, field: keyof HorarioDia, value: any) => {
    const novosHorarios = [...formData.horarios_funcionamento]
    novosHorarios[index] = { ...novosHorarios[index], [field]: value }
    setFormData({ ...formData, horarios_funcionamento: novosHorarios })
  }

  if (loading) return <div className="text-white p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-1 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('dados')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'dados' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Dados & Visual</button>
          <button type="button" onClick={() => setActiveTab('entrega')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'entrega' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Entrega & Bairros</button>
          <button type="button" onClick={() => setActiveTab('pagamento')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'pagamento' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Pagamentos</button>
          <button type="button" onClick={() => setActiveTab('operacao')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'operacao' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>Operação</button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          
          {/* ABA 1: DADOS & VISUAL */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              {/* ... (Código anterior mantido) ... */}
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Identidade Visual</h3>
              <div className="grid md:grid-cols-2 gap-6">
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
              <div className="space-y-4">
                <div><label className="text-gray-400 text-sm">Nome da Loja</label><input value={formData.nome_loja} onChange={e => setFormData({...formData, nome_loja: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
                <div><label className="text-gray-400 text-sm">Descrição / Slogan</label><textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 h-20 resize-none focus:border-primary outline-none" maxLength={200} /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-gray-400 text-sm">Telefone</label><input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
                  <div><label className="text-gray-400 text-sm">Endereço</label><input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: ENTREGA */}
          {activeTab === 'entrega' && (
             // ... (Código anterior mantido) ...
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Configuração Padrão</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="text-gray-400 text-sm">Taxa Base (R$)</label><input type="number" step="0.50" value={formData.taxa_entrega} onChange={(e) => handleNumberChange(e, 'taxa_entrega')} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
                <div><label className="text-gray-400 text-sm">Tempo Médio (min)</label><input type="number" value={formData.tempo_entrega_min} onChange={(e) => handleNumberChange(e, 'tempo_entrega_min')} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
                <div><label className="text-gray-400 text-sm">Pedido Mínimo (R$)</label><input type="number" step="1.00" value={formData.pedido_minimo} onChange={(e) => handleNumberChange(e, 'pedido_minimo')} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-primary outline-none" /></div>
              </div>
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mt-8">Taxas por Bairro / Região</h3>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full"><label className="text-xs text-gray-500">Nome do Bairro</label><input placeholder="Ex: Centro" value={novoBairro.nome} onChange={e => setNovoBairro({...novoBairro, nome: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" /></div>
                <div className="w-24"><label className="text-xs text-gray-500">Taxa (R$)</label><input type="number" placeholder="0.00" value={novoBairro.taxa} onChange={e => setNovoBairro({...novoBairro, taxa: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" /></div>
                <div className="w-24"><label className="text-xs text-gray-500">Prazo (min)</label><input type="number" placeholder="30" value={novoBairro.prazo} onChange={e => setNovoBairro({...novoBairro, prazo: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" /></div>
                <button type="button" onClick={addBairro} className="bg-primary text-secondary font-bold px-4 py-2 rounded text-sm hover:opacity-90 h-[38px]">+ Adicionar</button>
              </div>
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
                {bairros.map(b => (
                  <div key={b.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-gray-700">
                    <span className="text-white font-medium">{b.nome_bairro}</span>
                    <div className="flex items-center gap-4"><span className="text-gray-400 text-sm">{b.prazo_minutos} min</span><span className="text-green-400 font-bold">R$ {b.taxa_entrega.toFixed(2)}</span><button type="button" onClick={() => deleteBairro(b.id)} className="text-red-500 hover:text-red-400">✕</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: PAGAMENTOS */}
          {activeTab === 'pagamento' && (
            // ... (Código anterior mantido) ...
             <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Meios de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div onClick={() => setFormData({ ...formData, aceita_dinheiro: !formData.aceita_dinheiro })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 ${formData.aceita_dinheiro ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(255,209,0,0.2)]' : 'border-gray-700 bg-gray-800/30 text-gray-500 hover:bg-gray-800 hover:border-gray-600'}`}>
                  <div className={`text-4xl transition-all duration-300 ${formData.aceita_dinheiro ? 'scale-110' : 'grayscale opacity-50'}`}>💵</div>
                  <span className="font-bold text-lg">Dinheiro</span>
                  <div className={`w-5 h-5 rounded-full border-2 mt-2 flex items-center justify-center ${formData.aceita_dinheiro ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_dinheiro && <span className="text-secondary text-[10px] font-bold">✓</span>}</div>
                </div>
                <div onClick={() => setFormData({ ...formData, aceita_pix: !formData.aceita_pix })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 ${formData.aceita_pix ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(255,209,0,0.2)]' : 'border-gray-700 bg-gray-800/30 text-gray-500 hover:bg-gray-800 hover:border-gray-600'}`}>
                  <div className={`text-4xl transition-all duration-300 ${formData.aceita_pix ? 'scale-110' : 'grayscale opacity-50'}`}>💠</div>
                  <span className="font-bold text-lg">Pix</span>
                  <div className={`w-5 h-5 rounded-full border-2 mt-2 flex items-center justify-center ${formData.aceita_pix ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_pix && <span className="text-secondary text-[10px] font-bold">✓</span>}</div>
                </div>
                <div onClick={() => setFormData({ ...formData, aceita_cartao: !formData.aceita_cartao })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 ${formData.aceita_cartao ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(255,209,0,0.2)]' : 'border-gray-700 bg-gray-800/30 text-gray-500 hover:bg-gray-800 hover:border-gray-600'}`}>
                  <div className={`text-4xl transition-all duration-300 ${formData.aceita_cartao ? 'scale-110' : 'grayscale opacity-50'}`}>💳</div>
                  <span className="font-bold text-lg">Cartão</span>
                  <div className={`w-5 h-5 rounded-full border-2 mt-2 flex items-center justify-center ${formData.aceita_cartao ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_cartao && <span className="text-secondary text-[10px] font-bold">✓</span>}</div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: OPERAÇÃO (NOVO LAYOUT COM RADIO) */}
          {activeTab === 'operacao' && (
            <div className="space-y-8">
              
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-white font-bold">Controle Manual de Emergência</h4>
                  <p className="text-sm text-gray-400">Substitui qualquer configuração abaixo.</p>
                </div>
                <button 
                  type="button"
                  onClick={toggleLoja} 
                  className={`px-6 py-2 rounded font-bold text-white ${formData.aberta ? 'bg-red-600' : 'bg-green-600'}`}
                >
                  {formData.aberta ? 'FECHAR AGORA' : 'ABRIR AGORA'}
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Horário de Funcionamento</h3>
                
                <div className="space-y-4">
                  {/* Opção 1: Sempre Aberto */}
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo_horario === 'sempre_aberto' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="tipo_horario" 
                      className="w-5 h-5 text-primary focus:ring-primary bg-gray-700 border-gray-600"
                      checked={formData.tipo_horario === 'sempre_aberto'}
                      onChange={() => setFormData({ ...formData, tipo_horario: 'sempre_aberto' })}
                    />
                    <div className="ml-4">
                      <span className="block text-white font-bold">Sempre disponível</span>
                      <span className="text-sm text-gray-400">Seu estabelecimento sempre aparecerá aberto (24h).</span>
                    </div>
                  </label>

                  {/* Opção 2: Dias Específicos */}
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo_horario === 'dias_especificos' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="tipo_horario" 
                      className="w-5 h-5 text-primary focus:ring-primary bg-gray-700 border-gray-600"
                      checked={formData.tipo_horario === 'dias_especificos'}
                      onChange={() => setFormData({ ...formData, tipo_horario: 'dias_especificos' })}
                    />
                    <div className="ml-4">
                      <span className="block text-white font-bold">Disponível em dias e horários específicos</span>
                      <span className="text-sm text-gray-400">Escolha quando seu estabelecimento aparecerá aberto.</span>
                    </div>
                  </label>

                  {/* Opção 3: Agendado */}
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo_horario === 'agendado' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="tipo_horario" 
                      className="w-5 h-5 text-primary focus:ring-primary bg-gray-700 border-gray-600"
                      checked={formData.tipo_horario === 'agendado'}
                      onChange={() => setFormData({ ...formData, tipo_horario: 'agendado' })}
                    />
                    <div className="ml-4">
                      <span className="block text-white font-bold">Disponível apenas para pedidos agendados</span>
                      <span className="text-sm text-gray-400">O cliente escolhe um horário futuro para entrega.</span>
                    </div>
                  </label>

                   {/* Opção 4: Fechado */}
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo_horario === 'fechado' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="tipo_horario" 
                      className="w-5 h-5 text-primary focus:ring-primary bg-gray-700 border-gray-600"
                      checked={formData.tipo_horario === 'fechado'}
                      onChange={() => setFormData({ ...formData, tipo_horario: 'fechado' })}
                    />
                    <div className="ml-4">
                      <span className="block text-white font-bold">Fechado permanentemente</span>
                      <span className="text-sm text-gray-400">A loja não receberá novos pedidos.</span>
                    </div>
                  </label>
                </div>

                {/* TABELA DE HORÁRIOS (Aparece para Dias Específicos ou Agendado) */}
                {(formData.tipo_horario === 'dias_especificos' || formData.tipo_horario === 'agendado') && (
                  <div className="bg-gray-900 rounded-lg border border-gray-600 overflow-hidden animate-fade-in-down mt-6">
                    <div className="p-3 bg-gray-800 text-sm text-gray-400 border-b border-gray-700">
                      Configure os dias e intervalos de funcionamento:
                    </div>
                    {formData.horarios_funcionamento.map((h, index) => (
                      <div key={h.dia} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4 w-32">
                          <span className={`font-bold w-8 ${h.ativo ? 'text-white' : 'text-gray-600'}`}>{h.dia}</span>
                          <button 
                            type="button"
                            onClick={() => handleHorarioChange(index, 'ativo', !h.ativo)}
                            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${h.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                          >
                            {h.ativo ? 'Aberto' : 'Fechado'}
                          </button>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity ${h.ativo ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                          <input 
                            type="time" 
                            value={h.inicio} 
                            onChange={(e) => handleHorarioChange(index, 'inicio', e.target.value)}
                            className="bg-gray-700 text-white border border-gray-600 rounded p-1 text-sm focus:border-primary outline-none"
                          />
                          <span className="text-gray-400 text-sm">até</span>
                          <input 
                            type="time" 
                            value={h.fim} 
                            onChange={(e) => handleHorarioChange(index, 'fim', e.target.value)}
                            className="bg-gray-700 text-white border border-gray-600 rounded p-1 text-sm focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* RODAPÉ FIXO: SALVAR */}
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleSave} disabled={saving} className="bg-primary text-secondary font-bold py-3 px-8 rounded-lg hover:opacity-90 shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </div>

      {/* POP-UP DE SUCESSO */}
      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up border border-green-400">
          <div className="bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">✓</div>
          <span className="font-bold">Configurações salvas com sucesso!</span>
        </div>
      )}

    </div>
  )
}