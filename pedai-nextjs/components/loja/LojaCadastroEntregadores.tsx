'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { verificarLojaAberta } from '@/lib/utils/shopStatus'
import { useLojaStore } from '@/lib/stores/useLojaStore'

// Interfaces
interface Bairro { id: number; nome_bairro: string; taxa_entrega: number; prazo_minutos: number; ativo: boolean }
interface HorarioDia { dia: string; ativo: boolean; inicio: string; fim: string }

// Dados da Loja
interface FormData {
  // Visuais
  url_imagem: string; url_capa: string;
  
  // Informações (1)
  nome_loja: string; 
  descricao: string; 
  cnpj_cpf: string; 
  nome_responsavel: string;
  segmento: string;
  instagram: string;
  telefone: string; // Contato Principal
  contatos_extras: string[]; // Contatos Adicionais
  
  // Endereço (2)
  cep: string;
  logradouro: string; // Era 'endereco' antes, agora mais específico
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  referencia: string;
  ocultar_endereco: boolean;

  // Operação
  aberta: boolean; 
  tempo_entrega_min: number | string; 
  tempo_entrega_max: number | string; // Novo
  tempo_retirada_min: number | string; // Novo
  tempo_retirada_max: number | string; // Novo
  
  taxa_entrega: number | string; 
  pedido_minimo: number | string;
  
  aceita_dinheiro: boolean; aceita_pix: boolean; aceita_cartao: boolean;
  
  permite_delivery: boolean; // Novo
  permite_retirada: boolean; // Novo
  permite_consumo_local: boolean; // Novo

  tipo_horario: 'sempre_aberto' | 'dias_especificos' | 'agendado' | 'fechado';
  horarios_funcionamento: HorarioDia[];
  impressora_largura: number; slug_catalogo: string;
  
  // Mantido para compatibilidade temporária com código antigo
  endereco: string; 
}

// Dados do Dono
interface DonoData { nome_completo: string; email: string; cpf: string; telefone: string; }

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HORARIO_PADRAO: HorarioDia[] = DIAS_SEMANA.map(dia => ({ dia, ativo: true, inicio: '18:00', fim: '23:00' }))

export default function LojaConfiguracoesContent() {
  const router = useRouter()
  const { setConfig: setGlobalConfig } = useLojaStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'dados' | 'dono' | 'entrega' | 'pagamento' | 'operacao' | 'sistemas' | 'seguranca'>('dados')
  const [lojaId, setLojaId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(type === 'error' ? msg : msg) // Tradutor simplificado
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)

  // Forms
  const [formData, setFormData] = useState<FormData>({
    url_imagem: '', url_capa: '',
    nome_loja: '', descricao: '', cnpj_cpf: '', nome_responsavel: '', segmento: '', instagram: '', telefone: '', contatos_extras: [],
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '', referencia: '', ocultar_endereco: false,
    endereco: '', // Legado
    aberta: false, tipo_horario: 'sempre_aberto', horarios_funcionamento: HORARIO_PADRAO,
    permite_delivery: true, permite_retirada: true, permite_consumo_local: false,
    tempo_entrega_min: 30, tempo_entrega_max: 60, tempo_retirada_min: 15, tempo_retirada_max: 30,
    taxa_entrega: 5.00, pedido_minimo: 0.00,
    aceita_dinheiro: true, aceita_pix: true, aceita_cartao: true,
    impressora_largura: 80, slug_catalogo: ''
  })

  const [donoData, setDonoData] = useState<DonoData>({ nome_completo: '', email: '', cpf: '', telefone: '' })
  const [senhaData, setSenhaData] = useState({ atual: '', nova: '', confirmacao: '' })
  const [emailData, setEmailData] = useState({ atualSenha: '', novoEmail: '', confirmacaoEmail: '' })

  const [bairros, setBairros] = useState<Bairro[]>([])
  const [novoBairro, setNovoBairro] = useState({ nome: '', taxa: '', prazo: '' })
  const [novoContato, setNovoContato] = useState('')

  // --- MÁSCARAS ---
  const formatarTelefone = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15)
  const formatarCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  const formatarCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  
  const formatarCNPJ_CPF = (v: string) => {
    const nums = v.replace(/\D/g, '')
    if (nums.length <= 11) {
      return nums.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
    }
    return nums.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18)
  }

  useEffect(() => { loadData() }, [])

  // Relógio Visual
  const [statusReal, setStatusReal] = useState(false)
  useEffect(() => {
    const atualizar = () => setStatusReal(verificarLojaAberta(formData.tipo_horario, formData.horarios_funcionamento, formData.aberta))
    atualizar()
    const interval = setInterval(atualizar, 1000)
    return () => clearInterval(interval)
  }, [formData])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const { data: loja } = await supabase.from('lojas').select('*').eq('user_id', user.id).single()
    const { data: perfil } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()

    if (loja) {
      setLojaId(loja.id)
      setFormData({
        ...formData,
        ...loja, // Carrega campos existentes
        // Garante que arrays não sejam null
        contatos_extras: loja.contatos_extras || [],
        horarios_funcionamento: loja.horarios_funcionamento || HORARIO_PADRAO,
        // Valores padrão se null
        tempo_entrega_min: loja.tempo_entrega_min || 30,
        tempo_entrega_max: loja.tempo_entrega_max || 60,
        tempo_retirada_min: loja.tempo_retirada_min || 15,
        tempo_retirada_max: loja.tempo_retirada_max || 30,
        tipo_horario: loja.tipo_horario || 'sempre_aberto',
        // Preenche o logradouro com o endereço antigo se o novo estiver vazio
        logradouro: loja.logradouro || loja.endereco || ''
      })
      loadBairros(loja.id)
      setGlobalConfig(loja)
    }

    if (perfil) {
      setDonoData({
        nome_completo: perfil.nome_completo || '',
        email: perfil.email || user.email || '',
        cpf: perfil.cpf || '',
        telefone: perfil.telefone || ''
      })
    }
    setLoading(false)
  }

  // Handlers
  const handleContactAdd = () => {
    if (novoContato) {
      setFormData({ ...formData, contatos_extras: [...formData.contatos_extras, formatarTelefone(novoContato)] })
      setNovoContato('')
    }
  }
  const handleContactRemove = (i: number) => {
    setFormData({ ...formData, contatos_extras: formData.contatos_extras.filter((_, idx) => idx !== i) })
  }

  // ... (Funções loadBairros, addBairro, deleteBairro, handleUpload - MANTIDAS IGUAIS)
  const loadBairros = async (id: number) => { const supabase = createClient(); const { data } = await supabase.from('loja_bairros').select('*').eq('loja_id', id).order('nome_bairro'); if (data) setBairros(data) }
  const addBairro = async () => { if (!novoBairro.nome || !novoBairro.taxa || !lojaId) return notify('Preencha nome e taxa', 'error'); const supabase = createClient(); const { error } = await supabase.from('loja_bairros').insert({ loja_id: lojaId, nome_bairro: novoBairro.nome, taxa_entrega: parseFloat(novoBairro.taxa.replace(',', '.')), prazo_minutos: novoBairro.prazo ? parseInt(novoBairro.prazo) : Number(formData.tempo_entrega_min) || 30 }); if (error) notify('Erro: ' + error.message, 'error'); else { setNovoBairro({ nome: '', taxa: '', prazo: '' }); loadBairros(lojaId) } }
  const deleteBairro = async (id: number) => { const supabase = createClient(); const { error } = await supabase.from('loja_bairros').delete().eq('id', id); if (error) notify('Erro: ' + error.message, 'error'); else loadBairros(lojaId!) }
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'url_imagem' | 'url_capa') => { const isLogo = field === 'url_imagem'; try { if (isLogo) setUploadingLogo(true); else setUploadingCapa(true); const file = event.target.files?.[0]; if (!file || !lojaId) return; const supabase = createClient(); const fileExt = file.name.split('.').pop(); const fileName = `${lojaId}-${field}-${Math.random()}.${fileExt}`; const { error } = await supabase.storage.from('images').upload(fileName, file); if (error) throw error; const { data } = supabase.storage.from('images').getPublicUrl(fileName); setFormData(prev => ({ ...prev, [field]: data.publicUrl })); await supabase.from('lojas').update({ [field]: data.publicUrl }).eq('id', lojaId) } catch (error: any) { notify('Erro no upload: ' + error.message, 'error') } finally { if (isLogo) setUploadingLogo(false); else setUploadingCapa(false) } }
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => { setFormData({ ...formData, [field]: e.target.value }) }
  const handleHorarioChange = (index: number, field: keyof HorarioDia, value: any) => { const novosHorarios = [...formData.horarios_funcionamento]; novosHorarios[index] = { ...novosHorarios[index], [field]: value }; setFormData({ ...formData, horarios_funcionamento: novosHorarios }) }
  const toggleLoja = async () => { if (!lojaId) return; const novoStatus = !formData.aberta; const supabase = createClient(); await supabase.from('lojas').update({ aberta: novoStatus }).eq('id', lojaId); setFormData({ ...formData, aberta: novoStatus }); setGlobalConfig({ ...formData, aberta: novoStatus, id: lojaId } as any) }
  const handleUpdatePassword = async () => { /* ... */ }
  const handleUpdateEmail = async () => { /* ... */ }

  // SAVE GERAL
  const handleSave = async () => {
    if (!lojaId) return
    setSaving(true)
    const supabase = createClient()

    try {
      if (activeTab === 'dono') {
         if (userId) {
           const { error } = await supabase.from('perfis').update({
             nome_completo: donoData.nome_completo,
             cpf: donoData.cpf,
             telefone: donoData.telefone
           }).eq('user_id', userId)
           if (error) throw error
         }
      } else if (activeTab !== 'seguranca') {
        let novoStatusAberta = formData.aberta
        if (['sempre_aberto', 'dias_especificos', 'agendado'].includes(formData.tipo_horario)) novoStatusAberta = true 
        if (formData.tipo_horario === 'fechado') novoStatusAberta = false
        
        const updates = {
          ...formData,
          aberta: novoStatusAberta,
          // Endereço consolidado para compatibilidade
          endereco: `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado}`,
          
          tempo_entrega_min: Number(formData.tempo_entrega_min),
          tempo_entrega_max: Number(formData.tempo_entrega_max),
          tempo_retirada_min: Number(formData.tempo_retirada_min),
          tempo_retirada_max: Number(formData.tempo_retirada_max),
          taxa_entrega: Number(formData.taxa_entrega),
          pedido_minimo: Number(formData.pedido_minimo),
          impressora_largura: Number(formData.impressora_largura)
        }

        const { error } = await supabase.from('lojas').update(updates).eq('id', lojaId)
        if (error) throw error
        
        setFormData(prev => ({ ...prev, aberta: novoStatusAberta }))
        setGlobalConfig({ ...updates, id: lojaId } as any)
      }

      notify('Alterações salvas com sucesso!', 'success')
    } catch (error: any) {
      notify('Erro ao salvar: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
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

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-1 overflow-x-auto">
          {['dados', 'dono', 'entrega', 'pagamento', 'operacao', 'sistemas', 'seguranca'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-4 py-2 font-medium whitespace-nowrap capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'dados' ? 'Dados Loja' : tab}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          
          {/* ABA 1: DADOS DA LOJA (NOVA ESTRUTURA) */}
          {activeTab === 'dados' && (
            <div className="space-y-8">
              
              {/* Identidade Visual */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Identidade Visual</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="block text-gray-400 text-sm mb-2">Logo</label><div className="flex items-center gap-4"><div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden relative">{formData.url_imagem ? <img src={formData.url_imagem} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl">📸</span>}</div><input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_imagem')} className="text-sm text-gray-400" /></div></div>
                  <div><label className="block text-gray-400 text-sm mb-2">Capa</label><div className="flex flex-col gap-2"><div className="w-full h-24 bg-gray-700 rounded-lg overflow-hidden relative">{formData.url_capa ? <img src={formData.url_capa} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full">Banner</span>}</div><input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_capa')} className="text-sm text-gray-400" /></div></div>
                </div>
              </div>

              {/* Informações da Loja */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Informações</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-gray-400 text-sm">Nome do Estabelecimento *</label><input value={formData.nome_loja} onChange={e => setFormData({...formData, nome_loja: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">CNPJ ou CPF</label><input value={formData.cnpj_cpf} onChange={e => setFormData({...formData, cnpj_cpf: formatarCNPJ_CPF(e.target.value)})} maxLength={18} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Nome do Responsável</label><input value={formData.nome_responsavel} onChange={e => setFormData({...formData, nome_responsavel: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Segmento</label><input value={formData.segmento} onChange={e => setFormData({...formData, segmento: e.target.value})} placeholder="Ex: Pizzaria" className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Instagram</label><input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="@loja" className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  
                  <div><label className="text-gray-400 text-sm">Contato Principal *</label><input value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatarTelefone(e.target.value)})} maxLength={15} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  
                  <div>
                    <label className="text-gray-400 text-sm">Contatos Adicionais</label>
                    <div className="flex gap-2 mb-2">
                      <input value={novoContato} onChange={e => setNovoContato(formatarTelefone(e.target.value))} maxLength={15} className="flex-1 bg-gray-900 text-white p-2 rounded border border-gray-600 text-sm" placeholder="(00) 00000-0000" />
                      <button onClick={handleContactAdd} className="bg-gray-700 px-3 rounded text-white">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.contatos_extras.map((c, i) => (
                        <span key={i} className="bg-gray-900 border border-gray-600 px-2 py-1 rounded text-xs flex items-center gap-2 text-gray-300">
                          {c} <button onClick={() => handleContactRemove(i)} className="text-red-400 hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço Físico */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Endereço</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div><label className="text-gray-400 text-sm">CEP *</label><input value={formData.cep} onChange={e => setFormData({...formData, cep: formatarCEP(e.target.value)})} maxLength={9} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div className="md:col-span-3"><label className="text-gray-400 text-sm">Logradouro *</label><input value={formData.logradouro} onChange={e => setFormData({...formData, logradouro: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Número *</label><input value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div className="md:col-span-2"><label className="text-gray-400 text-sm">Bairro *</label><input value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Cidade *</label><input value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div><label className="text-gray-400 text-sm">Estado *</label><input value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                  <div className="md:col-span-2"><label className="text-gray-400 text-sm">Complemento</label><input value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input type="checkbox" id="ocultar" checked={formData.ocultar_endereco} onChange={e => setFormData({...formData, ocultar_endereco: e.target.checked})} className="w-4 h-4 bg-gray-900 border-gray-600 rounded text-primary" />
                  <label htmlFor="ocultar" className="text-sm text-gray-300 cursor-pointer">Ocultar endereço para clientes (Apenas Delivery)</label>
                </div>
              </div>
            </div>
          )}

          {/* ABA ENTREGA E TEMPOS (ATUALIZADA) */}
          {activeTab === 'entrega' && (
            <div className="space-y-8">
              {/* Modos de Entrega */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Formas de Entrega</h3>
                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.permite_delivery} onChange={e => setFormData({...formData, permite_delivery: e.target.checked})} className="w-5 h-5 text-primary bg-gray-900 border-gray-600 rounded" /><span className="text-white">🛵 Delivery</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.permite_retirada} onChange={e => setFormData({...formData, permite_retirada: e.target.checked})} className="w-5 h-5 text-primary bg-gray-900 border-gray-600 rounded" /><span className="text-white">🏪 Retirada no Balcão</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.permite_consumo_local} onChange={e => setFormData({...formData, permite_consumo_local: e.target.checked})} className="w-5 h-5 text-primary bg-gray-900 border-gray-600 rounded" /><span className="text-white">🍽️ Consumo no Local</span></label>
                </div>
              </div>

              {/* Tempos */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Estimativa de Tempo</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-gray-400 text-sm mb-3 uppercase font-bold">Delivery (Min/Max)</h4>
                    <div className="flex gap-2 items-center">
                      <input type="number" value={formData.tempo_entrega_min} onChange={e => handleNumberChange(e, 'tempo_entrega_min')} className="w-20 bg-gray-800 text-white p-2 rounded border border-gray-500 text-center" />
                      <span className="text-gray-500">a</span>
                      <input type="number" value={formData.tempo_entrega_max} onChange={e => handleNumberChange(e, 'tempo_entrega_max')} className="w-20 bg-gray-800 text-white p-2 rounded border border-gray-500 text-center" />
                      <span className="text-white text-sm">min</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-gray-400 text-sm mb-3 uppercase font-bold">Retirada (Min/Max)</h4>
                    <div className="flex gap-2 items-center">
                      <input type="number" value={formData.tempo_retirada_min} onChange={e => handleNumberChange(e, 'tempo_retirada_min')} className="w-20 bg-gray-800 text-white p-2 rounded border border-gray-500 text-center" />
                      <span className="text-gray-500">a</span>
                      <input type="number" value={formData.tempo_retirada_max} onChange={e => handleNumberChange(e, 'tempo_retirada_max')} className="w-20 bg-gray-800 text-white p-2 rounded border border-gray-500 text-center" />
                      <span className="text-white text-sm">min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuração de Taxas (Mantida) */}
              <div>
                 <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Taxas e Valores</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-gray-400 text-sm">Taxa de Entrega Padrão (R$)</label><input type="number" step="0.50" value={formData.taxa_entrega} onChange={e => handleNumberChange(e, 'taxa_entrega')} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                    <div><label className="text-gray-400 text-sm">Pedido Mínimo (R$)</label><input type="number" step="1.00" value={formData.pedido_minimo} onChange={e => handleNumberChange(e, 'pedido_minimo')} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div>
                 </div>
                 <div className="mt-6">
                    <h4 className="text-gray-400 text-sm mb-2">Taxas Específicas por Bairro</h4>
                    {/* Componente de Bairros Mantido */}
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex gap-2 mb-2">
                      <input placeholder="Bairro" value={novoBairro.nome} onChange={e => setNovoBairro({...novoBairro, nome: e.target.value})} className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-600" />
                      <input type="number" placeholder="Taxa" value={novoBairro.taxa} onChange={e => setNovoBairro({...novoBairro, taxa: e.target.value})} className="w-20 bg-gray-800 text-white p-2 rounded border border-gray-600" />
                      <button onClick={addBairro} className="bg-primary text-secondary px-4 rounded font-bold">+</button>
                    </div>
                    <div className="space-y-1">{bairros.map(b => <div key={b.id} className="flex justify-between bg-gray-800 p-2 rounded border border-gray-700 text-sm"><span className="text-white">{b.nome_bairro}</span><div className="flex gap-2"><span className="text-green-400">R$ {b.taxa_entrega.toFixed(2)}</span><button onClick={() => deleteBairro(b.id)} className="text-red-400">✕</button></div></div>)}</div>
                 </div>
              </div>
            </div>
          )}

          {/* DEMAIS ABAS MANTIDAS (DONO, PAGAMENTO, OPERACAO, SISTEMAS, SEGURANCA) */}
          {activeTab === 'dono' && (
             <div className="space-y-6"><h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Dados Pessoais (Proprietário)</h3><div className="grid md:grid-cols-2 gap-6"><div><label className="block text-gray-400 text-sm mb-2">Nome Completo</label><input value={donoData.nome_completo} onChange={e => setDonoData({...donoData, nome_completo: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-sm mb-2">CPF</label><input value={donoData.cpf} onChange={e => setDonoData({...donoData, cpf: formatarCPF(e.target.value)})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-sm mb-2">E-mail</label><input value={donoData.email} disabled className="w-full bg-gray-900 text-gray-500 p-3 rounded border border-gray-700 cursor-not-allowed" /></div><div><label className="block text-gray-400 text-sm mb-2">Celular</label><input value={donoData.telefone} onChange={e => setDonoData({...donoData, telefone: formatarTelefone(e.target.value)})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div></div></div>
          )}
          {activeTab === 'pagamento' && (
             <div className="space-y-6"><h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Meios de Pagamento</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"><div onClick={() => setFormData({ ...formData, aceita_dinheiro: !formData.aceita_dinheiro })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${formData.aceita_dinheiro ? 'border-primary bg-primary/10 text-white' : 'border-gray-700 bg-gray-800/30 text-gray-500'}`}><div className="text-4xl">💵</div><span className="font-bold">Dinheiro</span><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.aceita_dinheiro ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_dinheiro && <span className="text-secondary text-[10px]">✓</span>}</div></div><div onClick={() => setFormData({ ...formData, aceita_pix: !formData.aceita_pix })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${formData.aceita_pix ? 'border-primary bg-primary/10 text-white' : 'border-gray-700 bg-gray-800/30 text-gray-500'}`}><div className="text-4xl">💠</div><span className="font-bold">Pix</span><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.aceita_pix ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_pix && <span className="text-secondary text-[10px]">✓</span>}</div></div><div onClick={() => setFormData({ ...formData, aceita_cartao: !formData.aceita_cartao })} className={`cursor-pointer p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${formData.aceita_cartao ? 'border-primary bg-primary/10 text-white' : 'border-gray-700 bg-gray-800/30 text-gray-500'}`}><div className="text-4xl">💳</div><span className="font-bold">Cartão</span><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.aceita_cartao ? 'border-primary bg-primary' : 'border-gray-600'}`}>{formData.aceita_cartao && <span className="text-secondary text-[10px]">✓</span>}</div></div></div></div>
          )}
          {activeTab === 'operacao' && (
             <div className="space-y-8"><div className="bg-gray-900 p-4 rounded-lg border border-gray-600 flex justify-between items-center mb-6"><div><h4 className="text-white font-bold">Controle Manual</h4><p className="text-sm text-gray-400">Status em tempo real:</p></div><button type="button" onClick={toggleLoja} className={`px-6 py-2 rounded font-bold text-white ${statusReal ? 'bg-green-600' : 'bg-red-600'}`}>{statusReal ? 'ABERTA' : 'FECHADA'}</button></div><div><h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Horário de Funcionamento</h3><div className="space-y-4">{['sempre_aberto', 'dias_especificos', 'agendado', 'fechado'].map((tipo) => (<label key={tipo} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo_horario === tipo ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800'}`}><input type="radio" name="tipo_horario" className="w-5 h-5 text-primary bg-gray-700" checked={formData.tipo_horario === tipo} onChange={() => setFormData({ ...formData, tipo_horario: tipo as any })} /><div className="ml-4"><span className="block text-white font-bold">{tipo === 'sempre_aberto' && 'Sempre disponível'}{tipo === 'dias_especificos' && 'Dias e horários específicos'}{tipo === 'agendado' && 'Apenas pedidos agendados'}{tipo === 'fechado' && 'Fechado permanentemente'}</span></div></label>))}</div>{(formData.tipo_horario === 'dias_especificos' || formData.tipo_horario === 'agendado') && (<div className="bg-gray-900 rounded-lg border border-gray-600 overflow-hidden mt-6"><div className="p-3 bg-gray-800 text-sm text-gray-400 border-b border-gray-700">Configure os dias:</div>{formData.horarios_funcionamento.map((h, index) => (<div key={h.dia} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors"><div className="flex items-center gap-4 w-32"><span className={`font-bold w-8 ${h.ativo ? 'text-white' : 'text-gray-600'}`}>{h.dia}</span><button type="button" onClick={() => handleHorarioChange(index, 'ativo', !h.ativo)} className={`text-xs px-2 py-1 rounded font-medium ${h.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{h.ativo ? 'Aberto' : 'Fechado'}</button></div><div className={`flex items-center gap-2 transition-opacity ${h.ativo ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}><input type="time" value={h.inicio} onChange={(e) => handleHorarioChange(index, 'inicio', e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded p-1 text-sm" /><span className="text-gray-400 text-sm">até</span><input type="time" value={h.fim} onChange={(e) => handleHorarioChange(index, 'fim', e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded p-1 text-sm" /></div></div>))}</div>)}</div></div>
          )}
          {activeTab === 'sistemas' && (
            <div className="space-y-8"><div><h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Impressão</h3><div className="grid md:grid-cols-2 gap-4"><label className={`p-6 rounded-xl border-2 flex flex-col items-center cursor-pointer transition-all ${formData.impressora_largura === 80 ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800'}`}><input type="radio" name="impressora" className="hidden" checked={formData.impressora_largura === 80} onChange={() => setFormData({...formData, impressora_largura: 80})} /><span className="text-4xl mb-2">🖨️</span><span className="text-white font-bold">80mm</span></label><label className={`p-6 rounded-xl border-2 flex flex-col items-center cursor-pointer transition-all ${formData.impressora_largura === 58 ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800'}`}><input type="radio" name="impressora" className="hidden" checked={formData.impressora_largura === 58} onChange={() => setFormData({...formData, impressora_largura: 58})} /><span className="text-4xl mb-2">🧾</span><span className="text-white font-bold">58mm</span></label></div></div><div><h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Catálogo</h3><div className="bg-gray-900 p-6 rounded-xl border border-gray-700"><label className="block text-gray-400 text-sm mb-2">Link</label><div className="flex items-center bg-gray-800 rounded-lg border border-gray-600 overflow-hidden"><span className="px-4 text-gray-500 bg-gray-700 h-full flex items-center">pedeai.com/</span><input value={formData.slug_catalogo} onChange={e => setFormData({...formData, slug_catalogo: e.target.value.toLowerCase().replace(/\s/g, '-')})} className="flex-1 bg-transparent p-3 text-white outline-none" /></div></div></div></div>
          )}
          {activeTab === 'seguranca' && (
            /* Copie o conteúdo da aba segurança */
            <div className="grid md:grid-cols-2 gap-8"><div className="bg-gray-800 rounded-xl p-6 shadow-lg"><h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Alterar Senha</h3><div className="space-y-4"><div><label className="block text-gray-400 text-xs mb-1">Senha Atual</label><input type="password" value={senhaData.atual} onChange={e => setSenhaData({...senhaData, atual: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-xs mb-1">Nova Senha</label><input type="password" value={senhaData.nova} onChange={e => setSenhaData({...senhaData, nova: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-xs mb-1">Confirmar</label><input type="password" value={senhaData.confirmacao} onChange={e => setSenhaData({...senhaData, confirmacao: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><button onClick={handleUpdatePassword} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition">Atualizar Senha</button></div></div><div className="bg-gray-800 rounded-xl p-6 shadow-lg"><h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Alterar E-mail</h3><div className="space-y-4"><div><label className="block text-gray-400 text-xs mb-1">Senha Atual</label><input type="password" value={emailData.atualSenha} onChange={e => setEmailData({...emailData, atualSenha: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-xs mb-1">Novo E-mail</label><input value={emailData.novoEmail} onChange={e => setEmailData({...emailData, novoEmail: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><div><label className="block text-gray-400 text-xs mb-1">Confirmar E-mail</label><input value={emailData.confirmacaoEmail} onChange={e => setEmailData({...emailData, confirmacaoEmail: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600" /></div><button onClick={handleUpdateEmail} className="w-full bg-primary text-secondary font-bold py-3 rounded hover:opacity-90 transition">Atualizar E-mail</button></div></div></div>
          )}

        </div>

        {/* RODAPÉ FIXO (Salvar em todas as abas exceto segurança) */}
        {activeTab !== 'seguranca' && (
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleSave} disabled={saving} className="bg-primary text-secondary font-bold py-3 px-8 rounded-lg hover:opacity-90 shadow-lg transition-all disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        )}

      </div>

      {showToast && (
        <div className={`fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up border border-green-400`}>
          <div className="bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">✓</div>
          <span className="font-bold">Configurações salvas!</span>
        </div>
      )}
    </div>
  )
}