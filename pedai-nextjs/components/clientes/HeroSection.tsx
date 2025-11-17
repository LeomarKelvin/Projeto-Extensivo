'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TenantConfig } from '@/lib/types/tenant'

interface HeroSectionProps {
  tenant: TenantConfig
}

export default function HeroSection({ tenant }: HeroSectionProps) {
  const router = useRouter()
  const [endereco, setEndereco] = useState('')

  const handleBuscarLojas = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (endereco.trim()) {
      // Store address in localStorage
      localStorage.setItem('endereco_entrega', endereco)
      
      // Navigate to stores page
      router.push(`/${tenant.slug}/lojas`)
    }
  }

  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: tenant.theme.primary }}
        ></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000"
          style={{ backgroundColor: tenant.theme.primary }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Peça e receba em
            <br />
            <span className="text-tenant-primary">{tenant.name}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Delivery local para sua cidade. Comida, remédios, compras e muito mais, 
            entregue rápido na sua porta.
          </p>

          {/* Address Search Form */}
          <form onSubmit={handleBuscarLojas} className="max-w-2xl mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl shadow-2xl">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Digite seu endereço..."
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 font-semibold rounded-xl transition-all hover:opacity-90 whitespace-nowrap"
                style={{
                  backgroundColor: tenant.theme.primary,
                  color: tenant.theme.secondary,
                }}
              >
                Buscar Lojas
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-tenant-primary mb-2">50+</div>
              <div className="text-gray-400 text-sm">Lojas Parceiras</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-tenant-primary mb-2">{tenant.delivery.maxDistance}km</div>
              <div className="text-gray-400 text-sm">Raio de Entrega</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-tenant-primary mb-2">30min</div>
              <div className="text-gray-400 text-sm">Tempo Médio</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-tenant-primary mb-2">R$ {tenant.delivery.baseFee.toFixed(2)}</div>
              <div className="text-gray-400 text-sm">Taxa Mínima</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
