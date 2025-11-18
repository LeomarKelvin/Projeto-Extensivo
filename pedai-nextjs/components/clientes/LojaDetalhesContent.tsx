'use client'

import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'
import { useCart } from '@/lib/contexts/CartContext'

interface Loja {
  id: number
  nome_loja: string
  categoria?: string
  url_imagem?: string
  nota_avaliacao?: number
  municipio: string
  created_at: string
  aberta: boolean // Campo novo importante!
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

  const handleAddToCart = (produto: Produto) => {
    // Proteção extra: não deixa adicionar se loja fechada ou produto indisponível
    if (!loja.aberta || !produto.disponivel) return

    addItem({
      produto_id: produto.id.toString(),
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      loja_id: loja.id.toString(),
      loja_nome: loja.nome_loja,
      imagem_url: produto.imagem_url
    })
    alert('Produto adicionado ao carrinho!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      {/* Breadcrumb */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href={`/${tenant.slug}`} className="hover:text-tenant-primary transition-colors">
              Início
            </Link>
            <span>›</span>
            <Link href={`/${tenant.slug}/lojas`} className="hover:text-tenant-primary transition-colors">
              Lojas
            </Link>
            <span>›</span>
            <span className="text-white">{loja.nome_loja}</span>
          </div>
        </div>
      </div>

      {/* Cabeçalho da Loja */}
      <div className="bg-gray-900 border-b border-gray-800 relative overflow-hidden">
        {/* Aviso de Loja Fechada */}
        {!loja.aberta && (
          <div className="bg-red-600 text-white text-center py-3 font-bold text-lg animate-pulse">
            🔴 ESTA LOJA ESTÁ FECHADA NO MOMENTO
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
            {/* Logo da Loja */}
            <div className="w-32 h-32 bg-gray-800 rounded-xl flex items-center justify-center text-6xl flex-shrink-0 shadow-lg overflow-hidden border-2 border-gray-700">
              {loja.url_imagem ? (
                <img
                  src={loja.url_imagem}
                  alt={loja.nome_loja}
                  className="w-full h-full object-cover"
                />
              ) : (
                '🏪'
              )}
            </div>

            {/* Informações da Loja */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {loja.nome_loja}
                </h1>
                {loja.aberta ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50">
                    ABERTA
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/50">
                    FECHADA
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                {loja.categoria && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
                    {loja.categoria}
                  </span>
                )}
                {loja.nota_avaliacao && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    ⭐ <span className="font-bold">{loja.nota_avaliacao.toFixed(1)}</span>
                  </span>
                )}
              </div>

              <p className="text-gray-400 flex items-center gap-2">
                📍 {tenant.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-tenant-primary pl-4">
          Cardápio
        </h2>

        {produtos.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-400">
              Esta loja ainda não cadastrou itens no cardápio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => {
              // Lógica de bloqueio: Loja fechada OU Produto indisponível
              const isBlocked = !loja.aberta || !produto.disponivel
              
              return (
                <div
                  key={produto.id}
                  className={`bg-gray-800 rounded-xl overflow-hidden transition-all border border-gray-700 ${
                    isBlocked ? 'opacity-60 grayscale-[0.5]' : 'hover:border-tenant-primary hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Imagem do Produto */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center text-4xl relative">
                    {produto.imagem_url ? (
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '🍽️'
                    )}
                    {!produto.disponivel && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold bg-red-600 px-3 py-1 rounded">ESGOTADO</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {produto.nome}
                      </h3>
                    </div>

                    {produto.descricao && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5em]">
                        {produto.descricao}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700">
                      <span className="text-xl font-bold text-tenant-primary">
                        R$ {produto.preco.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleAddToCart(produto)}
                        disabled={isBlocked}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                          isBlocked
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-tenant-primary text-tenant-secondary hover:opacity-90'
                        }`}
                      >
                        {!loja.aberta 
                          ? 'Loja Fechada' 
                          : !produto.disponivel 
                            ? 'Indisponível' 
                            : 'Adicionar +'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}