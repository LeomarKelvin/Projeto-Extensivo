'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  lojaId: string
}

export default function LojaDetalhesContent({ tenant, lojaId }: LojaDetalhesContentProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const [loja, setLoja] = useState<Loja | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadLojaDetalhes = async () => {
      try {
        const response = await fetch(`/api/lojas/${lojaId}`, {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error('Loja não encontrada')
        }
        
        const data = await response.json()
        
        if (cancelled) return
        
        if (data.loja.municipio !== tenant.name) {
          setError('Esta loja não está disponível neste município')
          setLoading(false)
          return
        }
        
        setLoja(data.loja)
        setProdutos(data.produtos || [])
        setLoading(false)
      } catch (error) {
        if (cancelled) return
        console.error('Erro ao carregar loja:', error)
        setError('Não foi possível carregar os detalhes da loja')
        setLoading(false)
      }
    }
    
    loadLojaDetalhes()
    
    return () => {
      cancelled = true
    }
  }, [lojaId, tenant.name])

  const handleAddToCart = (produto: Produto) => {
    if (!loja) return
    
    addItem({
      produto_id: produto.id.toString(),
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      loja_id: loja.id.toString(),
      loja_nome: loja.nome_loja,
      imagem_url: produto.imagem_url
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-tenant-primary"></div>
          <p className="text-gray-400 mt-4">Carregando loja...</p>
        </div>
      </div>
    )
  }

  if (error || !loja) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-2">Ops!</h2>
          <p className="text-gray-400 mb-6">{error || 'Loja não encontrada'}</p>
          <Link
            href={`/${tenant.slug}/lojas`}
            className="inline-block px-6 py-3 bg-tenant-primary text-tenant-secondary rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Voltar para lojas
          </Link>
        </div>
      </div>
    )
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
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo da Loja */}
            <div className="w-32 h-32 bg-gray-800 rounded-xl flex items-center justify-center text-6xl flex-shrink-0">
              {loja.url_imagem ? (
                <img
                  src={loja.url_imagem}
                  alt={loja.nome_loja}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                '🏪'
              )}
            </div>

            {/* Informações da Loja */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {loja.nome_loja}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                {loja.categoria && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {loja.categoria}
                  </span>
                )}
                {loja.nota_avaliacao && (
                  <span className="flex items-center gap-1">
                    ⭐ <span className="font-semibold text-white">{loja.nota_avaliacao.toFixed(1)}</span>
                  </span>
                )}
              </div>

              <p className="text-gray-400">
                📍 {tenant.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Cardápio
        </h2>

        {produtos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-400">
              Esta loja ainda não cadastrou produtos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-tenant-primary transition-all"
              >
                {/* Imagem do Produto */}
                <div className="aspect-video bg-gray-900 flex items-center justify-center text-4xl">
                  {produto.imagem_url ? (
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🍽️'
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {produto.nome}
                  </h3>

                  {produto.descricao && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-tenant-primary">
                      R$ {produto.preco.toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleAddToCart(produto)}
                      className="px-6 py-2 bg-tenant-primary text-tenant-secondary rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
