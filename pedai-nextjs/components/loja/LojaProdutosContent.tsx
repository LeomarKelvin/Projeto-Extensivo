'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Produto {
  id: number
  nome: string
  descricao: string
  preco: number
  categoria: string
  imagem_url: string
  disponivel: boolean
}

export default function LojaProdutosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  // Estados do Modal
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'Outros',
    imagem_url: ''
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Busca a loja do usuário logado
      const { data: loja } = await supabase
        .from('lojas')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!loja) {
        // Se for admin, tenta pegar a primeira loja (modo debug)
        const { data: perfil } = await supabase.from('perfis').select('tipo').eq('user_id', user.id).single()
        if (perfil?.tipo === 'admin') {
           // Admin logic (opcional)
        } else {
           alert('Você não possui uma loja cadastrada.')
           router.push('/')
           return
        }
      }

      if (loja) {
        setLojaId(loja.id)
        loadProdutos(loja.id)
      }
    }
    init()
  }, [])

  const loadProdutos = async (idDaLoja: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', idDaLoja)
      .order('nome')
    
    if (data) setProdutos(data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lojaId) return

    const supabase = createClient()
    // Converte preço de string "10,50" para float 10.50 se necessário
    const precoFloat = parseFloat(formData.preco.toString().replace(',', '.'))

    const payload = {
      loja_id: lojaId,
      nome: formData.nome,
      descricao: formData.descricao,
      preco: precoFloat,
      categoria: formData.categoria,
      imagem_url: formData.imagem_url || null,
      disponivel: true
    }

    let error; // Variável para capturar se algo deu errado

    if (editingProduct) {
      // Atualizar existente
      const { error: updateError } = await supabase
        .from('produtos')
        .update(payload)
        .eq('id', editingProduct.id)
      error = updateError
    } else {
      // Criar novo
      const { error: insertError } = await supabase
        .from('produtos')
        .insert(payload)
      error = insertError
    }

    // Se o Supabase reclamar (der erro), avisa você na tela!
    if (error) {
      alert('Erro ao salvar produto: ' + error.message)
      console.error(error)
      return // Para aqui e não fecha a janelinha
    }

    // Se deu tudo certo:
    setShowModal(false)
    loadProdutos(lojaId)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Excluir este produto?')) {
      const supabase = createClient()
      await supabase.from('produtos').delete().eq('id', id)
      if (lojaId) loadProdutos(lojaId)
    }
  }

  const handleToggleStatus = async (produto: Produto) => {
    const supabase = createClient()
    await supabase
      .from('produtos')
      .update({ disponivel: !produto.disponivel })
      .eq('id', produto.id)
    
    if (lojaId) loadProdutos(lojaId)
  }

  const openModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduct(produto)
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || '',
        preco: produto.preco.toString(),
        categoria: produto.categoria || 'Outros',
        imagem_url: produto.imagem_url || ''
      })
    } else {
      setEditingProduct(null)
      setFormData({ nome: '', descricao: '', preco: '', categoria: 'Outros', imagem_url: '' })
    }
    setShowModal(true)
  }

  if (loading) return <div className="p-8 text-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Meus Produtos</h1>
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 text-sm hover:text-white">
              ← Voltar ao Dashboard
            </button>
          </div>
          <button onClick={() => openModal()} className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:opacity-90">
            + Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map(produto => (
            <div key={produto.id} className={`bg-gray-800 rounded-xl p-4 border-2 ${produto.disponivel ? 'border-transparent' : 'border-red-500/50 opacity-75'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-700 w-16 h-16 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
                  {produto.imagem_url ? (
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                  ) : '🍔'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(produto)} className="text-blue-400 text-sm hover:underline">Editar</button>
                  <button onClick={() => handleDelete(produto.id)} className="text-red-400 text-sm hover:underline">Excluir</button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{produto.nome}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2 h-10">{produto.descricao}</p>
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <span className="text-xl font-bold text-primary">R$ {produto.preco.toFixed(2)}</span>
                <button 
                  onClick={() => handleToggleStatus(produto)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${produto.disponivel ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                >
                  {produto.disponivel ? 'Ativo' : 'Pausado'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
              <h2 className="text-2xl font-bold text-white mb-6">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Nome do Produto" />
                <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Descrição" rows={3} />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Preço (R$)" />
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary">
                    <option>Lanches</option><option>Bebidas</option><option>Pizzas</option><option>Sobremesas</option><option>Outros</option>
                  </select>
                </div>
                <input value={formData.imagem_url} onChange={e => setFormData({...formData, imagem_url: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Link da Imagem (URL)" />
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-600 text-white rounded-lg">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-secondary font-bold rounded-lg">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}