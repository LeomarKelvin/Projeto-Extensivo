'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'
import { createClient } from '@/lib/supabase/client'

interface Loja {
  id: string
  nome_loja: string
  descricao?: string
  logo_url?: string
  categoria?: string
  avaliacao_media?: number
  tempo_entrega_medio?: number
  taxa_entrega?: number
  municipio?: string
  aberta?: boolean
}

interface LojasContentProps {
  tenant: TenantConfig
}

const CATEGORIAS = [
  { id: 'todas', nome: 'Todas', icone: '🏪' },
  { id: 'restaurante', nome: 'Restaurantes', icone: '🍔' },
  { id: 'mercado', nome: 'Mercados', icone: '🛒' },
  { id: 'farmacia', nome: 'Farmácias', icone: '💊' },
  { id: 'padaria', nome: 'Padarias', icone: '🥖' },
  { id: 'bebidas', nome: 'Bebidas', icone: '🍺' },
  { id: 'outros', nome: 'Outros', icone: '📦' },
]

export default function LojasContent({ tenant }: LojasContentProps) {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    loadLojas()
  }, [tenant])

  const loadLojas = async () => {
    try {
      // Call API with municipio parameter for tenant isolation
      const response = await fetch(`/api/lojas?municipio=${encodeURIComponent(tenant.name)}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar lojas')
      }
      
      const data = await response.json()
      setLojas(data || [])
    } catch (error) {
      console.error('Erro ao carregar lojas:', error)
    } finally {
      setLoading(false)
    }
  }

  const lojasFiltradas = lojas.filter(loja => {
    const matchCategoria = categoriaAtiva === 'todas' || loja.categoria === categoriaAtiva
    const matchBusca = !busca || 
      loja.nome_loja.toLowerCase().includes(busca.toLowerCase()) ||
      loja.descricao?.toLowerCase().includes(busca.toLowerCase())
    
    return matchCategoria && matchBusca
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Section */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Lojas em <span className="text-tenant-primary">{tenant.name}</span>
          </h1>
          <p className="text-gray-400">
            Descubra as melhores lojas da sua cidade
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl">
            <input
              type="text"
              placeholder="Buscar lojas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => setCategoriaAtiva(categoria.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                  categoriaAtiva === categoria.id
                    ? 'bg-tenant-primary text-tenant-secondary'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{categoria.icone}</span>
                <span>{categoria.nome}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lojas Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-tenant-primary"></div>
            <p className="text-gray-400 mt-4">Carregando lojas...</p>
          </div>
        ) : lojasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma loja encontrada</h3>
            <p className="text-gray-400">
              {busca 
                ? 'Tente buscar por outro termo'
                : 'Ainda não temos lojas nesta categoria'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lojasFiltradas.map((loja) => (
              <Link
                key={loja.id}
                href={`/${tenant.slug}/loja/${loja.id}`}
                className="group bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-tenant-primary transition-all"
              >
                <div className="aspect-video bg-gray-900 flex items-center justify-center text-6xl">
                  {loja.logo_url ? (
                    <img src={loja.logo_url} alt={loja.nome_loja} className="w-full h-full object-cover" />
                  ) : (
                    '🏪'
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-tenant-primary transition-colors">
                      {loja.nome_loja}
                    </h3>
                    {loja.aberta && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        Aberta
                      </span>
                    )}
                  </div>

                  {loja.descricao && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {loja.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {loja.avaliacao_media && (
                      <span className="flex items-center gap-1">
                        ⭐ {loja.avaliacao_media.toFixed(1)}
                      </span>
                    )}
                    {loja.tempo_entrega_medio && (
                      <span className="flex items-center gap-1">
                        ⏱️ {loja.tempo_entrega_medio} min
                      </span>
                    )}
                    {loja.taxa_entrega !== undefined && (
                      <span className="flex items-center gap-1">
                        🚚 R$ {loja.taxa_entrega.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
