'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LojaConfiguracoesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    aberta: false,
    tempo_entrega_min: 30,
    taxa_entrega: 5.00,
    pedido_minimo: 0.00,
    descricao: '' // Novo campo
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
        .select('id, aberta, tempo_entrega_min, taxa_entrega, pedido_minimo, descricao')
        .eq('user_id', user.id)
        .maybeSingle()

      if (loja) {
        setLojaId(loja.id)
        setFormData({
          aberta: loja.aberta ?? false,
          tempo_entrega_min: loja.tempo_entrega_min || 30,
          taxa_entrega: loja.taxa_entrega || 0,
          pedido_minimo: loja.pedido_minimo || 0,
          descricao: loja.descricao || '' // Carrega a descrição existente
        })
      } else {
        alert('Você precisa ter uma loja vinculada para acessar esta página.')
        router.push('/')
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    const supabase = createClient()
    const { error } = await supabase
      .from('lojas')
      .update({
        tempo_entrega_min: formData.tempo_entrega_min,
        taxa_entrega: formData.taxa_entrega,
        pedido_minimo: formData.pedido_minimo,
        descricao: formData.descricao // Salva a descrição
      })
      .eq('id', lojaId)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Configurações atualizadas com sucesso!')
    }
  }

  const toggleLoja = async () => {
    if (!lojaId) return
    const novoStatus = !formData.aberta
    const supabase = createClient()

    const { error } = await supabase
      .from('lojas')
      .update({ aberta: novoStatus })
      .eq('id', lojaId)

    if (error) {
      alert('Erro ao mudar status: ' + error.message)
    } else {
      setFormData({ ...formData, aberta: novoStatus })
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-white">Configurações da Loja</h1>
        </div>

        {/* Status da Loja */}
        <div className={`rounded-2xl p-8 mb-8 text-center border-4 transition-all ${
          formData.aberta 
            ? 'bg-green-500/10 border-green-500' 
            : 'bg-red-500/10 border-red-500'
        }`}>
          <h2 className="text-2xl font-bold text-white mb-4">
            Sua loja está {formData.aberta ? 'ABERTA 🟢' : 'FECHADA 🔴'}
          </h2>
          <p className="text-gray-400 mb-6">
            {formData.aberta 
              ? 'Os clientes podem fazer pedidos normalmente.' 
              : 'Seu cardápio aparece, mas os pedidos estão bloqueados.'}
          </p>
          <button
            onClick={toggleLoja}
            className={`px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform hover:scale-105 ${
              formData.aberta ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {formData.aberta ? 'FECHAR LOJA AGORA' : 'ABRIR LOJA AGORA'}
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
            Ajustes Operacionais
          </h3>
          
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* CAMPO DE DESCRIÇÃO */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Descrição da Loja (Slogan)</label>
              <textarea
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none transition-colors h-24 resize-none"
                placeholder="Ex: A melhor pizza da cidade, feita com ingredientes selecionados..."
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {formData.descricao.length}/200 caracteres
              </p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Tempo Médio de Entrega (minutos)</label>
              <input
                type="number"
                value={formData.tempo_entrega_min}
                onChange={e => setFormData({...formData, tempo_entrega_min: parseInt(e.target.value)})}
                className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Taxa de Entrega (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  value={formData.taxa_entrega}
                  onChange={e => setFormData({...formData, taxa_entrega: parseFloat(e.target.value)})}
                  className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Pedido Mínimo (R$)</label>
                <input
                  type="number"
                  step="1.00"
                  value={formData.pedido_minimo}
                  onChange={e => setFormData({...formData, pedido_minimo: parseFloat(e.target.value)})}
                  className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-secondary font-bold py-4 rounded-lg hover:opacity-90 transition-opacity mt-4 shadow-lg"
            >
              Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}