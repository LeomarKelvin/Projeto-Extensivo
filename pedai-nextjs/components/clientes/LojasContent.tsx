'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'

interface Loja {
  id: number
  nome_loja: string
  descricao?: string
  logo_url?: string
  url_imagem?: string
  categoria?: string
  nota_avaliacao?: number
  avaliacao?: number
  tempo_entrega_min?: number
  taxa_entrega?: number
  pedido_minimo?: number
  municipio?: string
  aberta?: boolean
}

interface LojasContentProps {
  tenant: TenantConfig
  initialLojas: Loja[]
  categoriaInicial?: string
}

const CATEGORIAS = [
  { id: 'todas', nome: 'Todas', icone: '🏪' },
  { id: 'restaurante', nome: 'Restaurantes', icone: '🍔' },
  { id: 'mercado', nome: 'Mercados', icone: '🛒' },
  { id: 'farmacia', nome: 'Farmácias', icone: '💊' },
  { id: 'padaria', nome: 'Padarias', icone: '🥖' },
  { id: 'bebidas', nome: 'Bebidas', icone: '🍺' },
  { id: 'lanchonete', nome: 'Lanchonetes', icone: '🌭' },
  { id: 'pizzaria', nome: 'Pizzarias', icone: '🍕' },
  { id: 'outros', nome: 'Outros', icone: '📦' },
]

const formatarTempo = (minutos?: number) => {
  if (!minutos) return '30-45 min'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const minsRestantes = minutos % 60
  return `${horas.toString().padStart(2, '0')}:${minsRestantes.toString().padStart(2, '0')}h`
}

export default function LojasContent({ tenant, initialLojas, categoriaInicial = 'todas' }: LojasContentProps) {
  const [lojas] = useState<Loja[]>(initialLojas)
  const [categoriaAtiva, setCategoriaAtiva] = useState(categoriaInicial)
  const [busca, setBusca] = useState('')

  const lojasFiltradas = lojas.filter(loja => {
    const catLoja = (loja.categoria || '').toLowerCase()
    const catFiltro = categoriaAtiva.toLowerCase()
    const matchCategoria = categoriaAtiva === 'todas' || catLoja.includes(catFiltro)
    const matchBusca = !busca || 
      loja.nome_loja.toLowerCase().includes(busca.toLowerCase()) ||
      loja.descricao?.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Lojas em <span className="text-tenant-primary">{tenant.name}</span>
          </h1>
          <p className="text-gray-400">Descubra o melhor do comércio local</p>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl">
            <input
              type="text"
              placeholder="Buscar lojas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => setCategoriaAtiva(categoria.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                  categoriaAtiva === categoria.id
                    ? 'bg-tenant-primary text-tenant-secondary shadow-lg scale-105'
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

      {/* Grid de Lojas */}
      <div className="container mx-auto px-4 py-8">
        {lojasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma loja encontrada</h3>
            <p className="text-gray-400">
              {busca ? 'Tente buscar por outro termo' : 'Ainda não temos lojas nesta categoria'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lojasFiltradas.map((loja) => {
              const imagem = loja.url_imagem || loja.logo_url
              const estaAberta = loja.aberta !== false

              return (
                <Link
                  key={loja.id}
                  href={`/${tenant.slug}/loja/${loja.id}`}
                  className={`group bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-gray-700 flex flex-col h-full ${
                    !estaAberta ? 'grayscale opacity-80' : 'hover:border-tenant-primary/50'
                  }`}
                >
                  {/* Imagem */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center text-6xl relative overflow-hidden">
                    {imagem ? (
                      <img 
                        src={imagem} 
                        alt={loja.nome_loja} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : '🏪'}
                    
                    {/* Badge de Status */}
                    <div className="absolute top-2 right-2 z-10">
                      {estaAberta ? (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md tracking-wide">ABERTA</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-md tracking-wide">FECHADA</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-tenant-primary transition-colors line-clamp-1">
                        {loja.nome_loja}
                      </h3>
                      <div className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded text-yellow-400 text-xs font-bold">
                        ⭐ {(loja.avaliacao || loja.nota_avaliacao || 5.0).toFixed(1)}
                      </div>
                    </div>

                    {/* Descrição com Altura Fixa (Correção do Alinhamento) */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                      {loja.descricao ? loja.descricao : <span className="invisible">Espaço reservado para manter o layout alinhado</span>}
                    </p>

                    {/* Informações */}
                    <div className="mt-auto space-y-2 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">🕒 Tempo de espera:</span>
                        <span className="text-white font-medium">{formatarTempo(loja.tempo_entrega_min)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">🚚 Taxa de entrega:</span>
                        <span className={`font-medium ${loja.taxa_entrega === 0 ? 'text-green-400' : 'text-white'}`}>
                          {loja.taxa_entrega === 0 ? 'Grátis' : `R$ ${loja.taxa_entrega?.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">💰 Pedido mínimo:</span>
                        <span className="text-white font-medium">
                          {loja.pedido_minimo && loja.pedido_minimo > 0 ? `R$ ${loja.pedido_minimo.toFixed(2)}` : 'R$ 0,00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}