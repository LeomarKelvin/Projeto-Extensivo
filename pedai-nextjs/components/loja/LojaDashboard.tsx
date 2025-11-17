'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  pedidosHoje: number
  receitaHoje: number
  pedidosPendentes: number
  produtosAtivos: number
}

export default function LojaDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    pedidosHoje: 0,
    receitaHoje: 0,
    pedidosPendentes: 0,
    produtosAtivos: 0,
  })
  const [loja, setLoja] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get user profile
    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!perfil || perfil.tipo !== 'loja') {
      router.push('/')
      return
    }

    // Get loja data
    const { data: lojaData } = await supabase
      .from('lojas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setLoja(lojaData)
    
    // Load stats (mock data for now)
    setStats({
      pedidosHoje: 12,
      receitaHoje: 450.00,
      pedidosPendentes: 3,
      produtosAtivos: 25,
    })
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-tenant-primary"></div>
          <p className="text-gray-400 mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Bem-vindo de volta, {loja?.nome_loja || 'Loja'}!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pedidos Hoje</span>
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.pedidosHoje}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Receita Hoje</span>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-white">R$ {stats.receitaHoje.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pendentes</span>
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.pedidosPendentes}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Produtos Ativos</span>
              <span className="text-3xl">🛍️</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.produtosAtivos}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/loja/pedidos')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">Gerenciar Pedidos</h3>
            <p className="text-gray-400">Visualize e atualize o status dos pedidos</p>
          </button>

          <button
            onClick={() => router.push('/loja/produtos')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
            <h3 className="text-xl font-bold text-white mb-2">Produtos</h3>
            <p className="text-gray-400">Adicione e edite produtos do cardápio</p>
          </button>

          <button
            onClick={() => router.push('/loja/configuracoes')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Configurações</h3>
            <p className="text-gray-400">Gerencie informações da loja</p>
          </button>

          <button
            onClick={() => router.push('/loja/financeiro')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💳</div>
            <h3 className="text-xl font-bold text-white mb-2">Financeiro</h3>
            <p className="text-gray-400">Acompanhe vendas e pagamentos</p>
          </button>

          <button
            onClick={() => router.push('/loja/promocoes')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎁</div>
            <h3 className="text-xl font-bold text-white mb-2">Promoções</h3>
            <p className="text-gray-400">Crie ofertas especiais</p>
          </button>

          <button
            onClick={() => router.push('/loja/relatorios')}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Relatórios</h3>
            <p className="text-gray-400">Analise o desempenho da loja</p>
          </button>
        </div>
      </div>
    </div>
  )
}
