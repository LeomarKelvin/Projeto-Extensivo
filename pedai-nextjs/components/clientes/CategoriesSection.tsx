'use client'

import Link from 'next/link'
import type { TenantConfig } from '@/lib/types/tenant'

interface CategoriesSectionProps {
  tenant: TenantConfig
}

const CATEGORIES = [
  { id: 'restaurante', name: 'Restaurantes', icon: '🍔', color: 'from-red-500 to-orange-500' },
  { id: 'mercado', name: 'Mercados', icon: '🛒', color: 'from-green-500 to-emerald-500' },
  { id: 'farmacia', name: 'Farmácias', icon: '💊', color: 'from-blue-500 to-cyan-500' },
  { id: 'padaria', name: 'Padarias', icon: '🥖', color: 'from-yellow-500 to-amber-500' },
  { id: 'bebidas', name: 'Bebidas', icon: '🍺', color: 'from-purple-500 to-pink-500' },
  { id: 'lanchonete', name: 'Lanchonetes', icon: '🌭', color: 'from-orange-500 to-red-500' },
  { id: 'pizzaria', name: 'Pizzarias', icon: '🍕', color: 'from-red-600 to-orange-600' },
  { id: 'outros', name: 'Outros', icon: '📦', color: 'from-gray-500 to-gray-600' },
]

export default function CategoriesSection({ tenant }: CategoriesSectionProps) {
  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Categorias
          </h2>
          <p className="text-gray-400 text-lg">
            Encontre exatamente o que você procura
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/${tenant.slug}/lojas?categoria=${category.id}`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-center transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${tenant.theme.primary}15, ${tenant.theme.primary}05)`,
                border: `1px solid ${tenant.theme.primary}30`,
              }}
            >
              <div className="relative z-10">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="text-white font-semibold text-lg">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
