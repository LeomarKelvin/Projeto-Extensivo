'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'
import { useCart } from '@/lib/contexts/CartContext'

interface Loja {
  id: number
  nome_loja: string
  categoria?: string
  url_imagem?: string // Logo
  url_capa?: string   // Capa
  nota_avaliacao?: number
  municipio: string
  created_at: string
  aberta: boolean
  descricao?: string
}

interface Produto {
  id: number
  nome: string
  descricao?: string
  preco: number
  imagem_url?: string
  disponivel: boolean
  loja_id: number
  created_at: string
}

interface LojaDetalhesContentProps {
  tenant: TenantConfig
  loja: Loja
  produtos: Produto[]
}

export default function LojaDetalhesContent({ tenant, loja, produtos }: LojaDetalhesContentProps) {
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState('')

  const openModal = (produto: Produto) => {
    if (!loja.aberta || !produto.disponivel) return
    setSelectedProduct(produto)
    setQuantity(1)
    setObservation('')
  }

  const closeModal = () => setSelectedProduct(null)

  const handleConfirmAdd = () => {
    if (!selectedProduct) return
    addItem({
      produto_id: selectedProduct.id.toString(),
      nome: selectedProduct.nome,
      preco: selectedProduct.preco,
      quantidade: quantity,
      observacao: observation,
      loja_id: loja.id.toString(),
      loja_nome: loja.nome_loja,
      imagem_url: selectedProduct.imagem_url
    })
    closeModal()
    alert(`Adicionado: ${quantity}x ${selectedProduct.nome}`)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* HEADER COM CAPA */}
      <div className="relative w-full h-48 md:h-64 bg-gray-800">
        {loja.url_capa ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loja.url_capa})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/50 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center text-gray-600">
            <span className="text-4xl opacity-20">🏠</span>
          </div>
        )}
        <div className="absolute top-4 left-4 z-20">
          <Link href={`/${tenant.slug}/lojas`} className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium transition-colors flex items-center gap-2">← Voltar</Link>
        </div>
        {!loja.aberta && (
          <div className="absolute top-4 right-4 z-20 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">FECHADA</div>
        )}
      </div>

      {/* INFO DA LOJA */}
      <div className="container mx-auto px-4 -mt-12 relative z-10 mb-8">
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-900 overflow-hidden flex-shrink-0">
            {loja.url_imagem ? <img src={loja.url_imagem} alt={loja.nome_loja} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🏪</div>}
          </div>
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-md">{loja.nome_loja}</h1>
              {loja.nota_avaliacao && <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">★ {loja.nota_avaliacao.toFixed(1)}</span>}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-1">
              {loja.categoria && <span className="text-tenant-primary font-medium">{loja.categoria}</span>}
              <span>•</span><span>{tenant.name}</span>
            </div>
          </div>
        </div>
        {loja.descricao && <div className="mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm leading-relaxed max-w-3xl">{loja.descricao}</div>}
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-tenant-primary pl-4">Cardápio</h2>
        {produtos.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700 border-dashed"><p className="text-gray-500 text-lg">Nenhum produto disponível.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => {
              const isBlocked = !loja.aberta || !produto.disponivel
              return (
                <div key={produto.id} onClick={() => !isBlocked && openModal(produto)} className={`bg-gray-800 rounded-xl overflow-hidden transition-all border border-gray-700 cursor-pointer flex ${isBlocked ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : 'hover:border-tenant-primary hover:shadow-xl hover:-translate-y-1'}`}>
                  <div className="w-1/3 bg-gray-900 relative">
                    {produto.imagem_url ? <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-between">
                    <div><h3 className="text-base font-bold text-white leading-tight mb-1">{produto.nome}</h3>{produto.descricao && <p className="text-gray-400 text-xs line-clamp-2 mb-2">{produto.descricao}</p>}</div>
                    <div className="flex items-center justify-between mt-2"><span className="text-lg font-bold text-tenant-primary">R$ {produto.preco.toFixed(2)}</span>{!isBlocked && <span className="text-2xl text-tenant-primary">+</span>}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-700">
            <div className="h-48 bg-gray-700 flex items-center justify-center text-6xl relative">
               {selectedProduct.imagem_url ? <img src={selectedProduct.imagem_url} className="w-full h-full object-cover" /> : '🍔'}
               <button onClick={closeModal} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600">✕</button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-1">{selectedProduct.nome}</h2>
              <p className="text-gray-400 text-sm mb-6">{selectedProduct.descricao}</p>
              <div className="mb-6"><label className="block text-sm font-medium text-gray-300 mb-2">Alguma observação?</label><textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Tirar a cebola..." className="w-full bg-gray-900 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-tenant-primary h-20 resize-none" maxLength={140} /></div>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                <div className="flex items-center bg-gray-900 rounded-lg p-1"><button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-md font-bold">-</button><span className="w-8 text-center text-white font-bold">{quantity}</span><button onClick={() => setQuantity(q => Math.min(50, q + 1))} className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-md font-bold">+</button></div>
                <button onClick={handleConfirmAdd} className="flex-1 bg-tenant-primary text-tenant-secondary py-3 rounded-xl font-bold hover:opacity-90 flex justify-between px-6"><span>Adicionar</span><span>R$ {(selectedProduct.preco * quantity).toFixed(2)}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}