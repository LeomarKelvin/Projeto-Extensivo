'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Cupom {
  id: number
  codigo: string
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis'
  valor: number
  valor_minimo_pedido: number
  uso_maximo: number | null
  uso_atual: number
  ativo: boolean
}

// Interface flexível para o formulário (aceita string vazia durante a digitação)
interface CupomForm {
  codigo: string
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis'
  valor: number | string
  valor_minimo_pedido: number | string
  uso_maximo: number | string | null
  ativo: boolean
}

export default function LojaPromocoesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [lojaId, setLojaId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState<CupomForm>({
    codigo: '',
    tipo: 'percentual',
    valor: 0,
    valor_minimo_pedido: 0,
    uso_maximo: '',
    ativo: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: loja } = await supabase.from('lojas').select('id').eq('user_id', user.id).single()
    
    if (loja) {
      setLojaId(loja.id)
      const { data } = await supabase
        .from('cupons')
        .select('*')
        .eq('loja_id', loja.id)
        .order('created_at', { ascending: false })
      
      if (data) setCupons(data)
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    const supabase = createClient()
    
    // Converte para número ao salvar. Se estiver vazio, assume 0 ou null.
    const payload = {
      loja_id: lojaId,
      codigo: formData.codigo?.toUpperCase(),
      tipo: formData.tipo,
      valor: Number(formData.valor) || 0,
      valor_minimo_pedido: Number(formData.valor_minimo_pedido) || 0,
      uso_maximo: formData.uso_maximo ? Number(formData.uso_maximo) : null,
      ativo: formData.ativo
    }

    const { error } = await supabase.from('cupons').insert(payload)

    if (error) alert('Erro ao criar cupom: ' + error.message)
    else {
      setShowModal(false)
      // Reseta o formulário
      setFormData({ codigo: '', tipo: 'percentual', valor: 0, valor_minimo_pedido: 0, uso_maximo: '', ativo: true })
      loadData()
    }
  }

  // Função genérica para inputs numéricos (evita o NaN)
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof CupomForm) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  // --- DELETE IMEDIATO (SEM CONFIRMAÇÃO) ---
  const handleDelete = async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('cupons').delete().eq('id', id)
    
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      loadData()
    }
  }

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const supabase = createClient()
    await supabase.from('cupons').update({ ativo: !currentStatus }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Promoções</h1>
              <p className="text-gray-400 text-sm">Crie cupons para atrair clientes</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:opacity-90 flex items-center gap-2"
          >
            <span>🎫</span> Criar Cupom
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cupons.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
              <p className="text-gray-500 text-lg">Nenhum cupom ativo.</p>
            </div>
          )}

          {cupons.map(cupom => (
            <div key={cupom.id} className={`bg-gray-800 rounded-xl p-5 border-l-4 shadow-lg flex justify-between items-center ${cupom.ativo ? 'border-green-500' : 'border-gray-600 opacity-75'}`}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl font-bold text-white tracking-wider">{cupom.codigo}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${cupom.ativo ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
                    {cupom.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {cupom.tipo === 'frete_gratis' ? 'Frete Grátis' : 
                   cupom.tipo === 'percentual' ? `${cupom.valor}% de Desconto` : 
                   `R$ ${cupom.valor.toFixed(2)} de Desconto`}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Mínimo: R$ {cupom.valor_minimo_pedido?.toFixed(2) || '0.00'} • Usos: {cupom.uso_atual}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(cupom.id, cupom.ativo)} 
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white text-xs font-bold"
                >
                  {cupom.ativo ? 'Pausar' : 'Ativar'}
                </button>
                <button 
                  onClick={() => handleDelete(cupom.id)} 
                  className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                  title="Excluir Cupom"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL DE CRIAÇÃO */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Novo Cupom</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Código do Cupom (Sem espaços)</label>
                  <input 
                    required 
                    value={formData.codigo} 
                    onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                    placeholder="Ex: NATAL10"
                    className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none uppercase font-bold tracking-widest" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Tipo</label>
                    <select 
                      value={formData.tipo} 
                      onChange={e => setFormData({...formData, tipo: e.target.value as any})} 
                      className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none"
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor_fixo">Valor Fixo (R$)</option>
                      <option value="frete_gratis">Frete Grátis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Valor</label>
                    <input 
                      type="number" 
                      disabled={formData.tipo === 'frete_gratis'}
                      value={formData.valor} 
                      onChange={(e) => handleNumberChange(e, 'valor')}
                      className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none disabled:opacity-50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Pedido Mínimo (R$)</label>
                  <input 
                    type="number" 
                    value={formData.valor_minimo_pedido} 
                    onChange={(e) => handleNumberChange(e, 'valor_minimo_pedido')}
                    className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none" 
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Limite de Usos (Opcional)</label>
                  <input 
                    type="number" 
                    value={formData.uso_maximo || ''} // Usa string vazia se for null para não dar warning
                    onChange={(e) => handleNumberChange(e, 'uso_maximo')}
                    placeholder="Ex: 50 primeiros"
                    className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-primary outline-none" 
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-primary text-secondary font-bold rounded-lg hover:opacity-90 mt-4">
                  Criar Cupom
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}