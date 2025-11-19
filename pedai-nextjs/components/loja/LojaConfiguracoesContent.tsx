'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LojaConfiguracoesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    aberta: false,
    tempo_entrega_min: 30,
    taxa_entrega: 5.00,
    pedido_minimo: 0.00,
    descricao: '',
    telefone: '',
    endereco: '',
    url_imagem: '',
    url_capa: ''
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: loja } = await supabase
        .from('lojas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (loja) {
        setLojaId(loja.id)
        setFormData({
          aberta: loja.aberta ?? false,
          tempo_entrega_min: loja.tempo_entrega_min || 30,
          taxa_entrega: loja.taxa_entrega || 0,
          pedido_minimo: loja.pedido_minimo || 0,
          descricao: loja.descricao || '',
          telefone: loja.telefone || '',
          endereco: loja.endereco || '',
          url_imagem: loja.url_imagem || '',
          url_capa: loja.url_capa || ''
        })
      } else {
        alert('Loja não encontrada.')
        router.push('/')
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'url_imagem' | 'url_capa') => {
    const isLogo = field === 'url_imagem'
    
    try {
      if (isLogo) setUploadingLogo(true)
      else setUploadingCapa(true)

      const file = event.target.files?.[0]
      if (!file) return

      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${lojaId}-${field}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, [field]: publicUrl }))

    } catch (error: any) {
      alert('Erro no upload: ' + error.message)
    } finally {
      if (isLogo) setUploadingLogo(false)
      else setUploadingCapa(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    setSaving(true)
    const supabase = createClient()
    
    const updates = {
      tempo_entrega_min: Number(formData.tempo_entrega_min) || 0,
      taxa_entrega: Number(formData.taxa_entrega) || 0,
      pedido_minimo: Number(formData.pedido_minimo) || 0,
      descricao: formData.descricao,
      telefone: formData.telefone,
      endereco: formData.endereco,
      url_imagem: formData.url_imagem,
      url_capa: formData.url_capa
    }

    const { error } = await supabase.from('lojas').update(updates).eq('id', lojaId)

    setSaving(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Dados atualizados com sucesso!')
    }
  }

  const toggleLoja = async () => {
    if (!lojaId) return
    const novoStatus = !formData.aberta
    const supabase = createClient()
    await supabase.from('lojas').update({ aberta: novoStatus }).eq('id', lojaId)
    setFormData({ ...formData, aberta: novoStatus })
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white transition-colors">← Voltar</button>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
        </div>

        <div className={`rounded-2xl p-6 mb-8 text-center border-4 transition-all ${formData.aberta ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
          <h2 className="text-2xl font-bold text-white mb-2">Loja {formData.aberta ? 'ABERTA 🟢' : 'FECHADA 🔴'}</h2>
          <button onClick={toggleLoja} className={`px-6 py-2 rounded-lg font-bold text-white mt-2 ${formData.aberta ? 'bg-red-600' : 'bg-green-600'}`}>
            {formData.aberta ? 'FECHAR LOJA' : 'ABRIR LOJA'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          
          {/* IMAGENS */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Identidade Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Logo */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Logo (Quadrada)</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-600 relative shrink-0">
                    {formData.url_imagem ? <img src={formData.url_imagem} className="w-full h-full object-cover" /> : <span className="text-2xl">Logo</span>}
                    {uploadingLogo && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">⌛</div>}
                  </div>
                  <div className="w-full">
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_imagem')} className="text-sm text-gray-400 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                    <p className="text-xs text-gray-500 mt-1">Ideal: 500x500px (Quadrado)</p>
                  </div>
                </div>
              </div>

              {/* Capa */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Capa / Banner (Retangular)</label>
                <div className="flex flex-col gap-2">
                  <div className="w-full h-32 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-600 relative">
                    {formData.url_capa ? <img src={formData.url_capa} className="w-full h-full object-cover" /> : <span className="text-2xl">Capa da Vitrine</span>}
                    {uploadingCapa && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">⌛</div>}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'url_capa')} className="text-sm text-gray-400 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                  <p className="text-xs text-gray-500">Ideal: 1000x400px (Retangular)</p>
                </div>
              </div>

            </div>
          </div>

          {/* Informações */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Dados e Descrição</h3>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1 font-medium">Descrição (Slogan)</label>
              <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none h-20 resize-none" placeholder="A melhor da cidade..." maxLength={200} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1 font-medium">Telefone / WhatsApp</label>
                <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1 font-medium">Endereço Completo</label>
                <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" placeholder="Rua, Número, Bairro" />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Valores e Prazos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1 font-medium">Tempo Médio (min)</label>
                <input type="number" value={formData.tempo_entrega_min} onChange={e => setFormData({...formData, tempo_entrega_min: parseInt(e.target.value)})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1 font-medium">Taxa de Entrega (R$)</label>
                <input type="number" step="0.50" value={formData.taxa_entrega} onChange={e => setFormData({...formData, taxa_entrega: parseFloat(e.target.value)})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1 font-medium">Pedido Mínimo (R$)</label>
                <input type="number" step="1.00" value={formData.pedido_minimo} onChange={e => setFormData({...formData, pedido_minimo: parseFloat(e.target.value)})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-primary outline-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-primary text-secondary font-bold py-4 rounded-lg hover:opacity-90 shadow-lg transition-all">
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        </form>
      </div>
    </div>
  )
}