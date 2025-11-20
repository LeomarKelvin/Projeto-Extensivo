'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext' // <--- Usar o contexto rápido

interface DashboardStats {
  pedidosHoje: number
  receitaHoje: number
  pedidosPendentes: number
  produtosAtivos: number
}

export default function LojaDashboard() {
  const router = useRouter()
  
  // Pega os dados JÁ CARREGADOS do contexto (sem esperar o banco de novo)
  const { user, profile, loja, loading: authLoading } = useAuth()
  
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    pedidosHoje: 0,
    receitaHoje: 0,
    pedidosPendentes: 0,
    produtosAtivos: 0,
  })

  // Efeito inteligente: Só roda quando o AuthContext terminar de carregar
  useEffect(() => {
    if (!authLoading) {
      // 1. Verificações de segurança
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      if (!profile || (profile.tipo !== 'loja' && profile.tipo !== 'admin')) {
        router.push('/')
        return
      }

      // 2. Se já temos a loja (veio do contexto), carrega os stats
      if (loja) {
        loadStats(loja.id)
      } else {
        // Se é loja mas não tem dados de loja, algo está errado
        console.error('Loja não encontrada para este perfil')
        router.push('/')
      }
    }
  }, [user, profile, loja, authLoading, router])

  const loadStats = async (lojaId: number) => {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    // Busca tudo em paralelo para ser mais rápido
    const [
      { count: pedidosHojeCount },
      { data: pedidosHoje },
      { count: pendentesCount },
      { count: produtosCount }
    ] = await Promise.all([
      supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('loja_id', lojaId).gte('created_at', todayISO),
      supabase.from('pedidos').select('total').eq('loja_id', lojaId).gte('created_at', todayISO).not('status', 'eq', 'cancelado'),
      supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('loja_id', lojaId).in('status', ['pendente', 'aceito', 'preparando', 'pronto']),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('loja_id', lojaId).eq('disponivel', true)
    ])

    const receitaHoje = pedidosHoje?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

    setStats({
      pedidosHoje: pedidosHojeCount || 0,
      receitaHoje: receitaHoje,
      pedidosPendentes: pendentesCount || 0,
      produtosAtivos: produtosCount || 0,
    })
    setStatsLoading(false)
  }

  // Enquanto o AuthContext (memória) não confirma quem é você, mostra loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary border-gray-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Bem-vindo de volta, {loja?.nome_loja || 'Loja'}!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-blue-500 shadow-lg">
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Pedidos Hoje</span><span className="text-2xl">📦</span></div>
            <p className="text-3xl font-bold text-white">{statsLoading ? '...' : stats.pedidosHoje}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-green-500 shadow-lg">
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Receita Hoje</span><span className="text-2xl">💰</span></div>
            <p className="text-3xl font-bold text-white">R$ {statsLoading ? '...' : stats.receitaHoje.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-yellow-500 shadow-lg">
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Pendentes</span><span className="text-2xl">⏳</span></div>
            <p className="text-3xl font-bold text-white">{statsLoading ? '...' : stats.pedidosPendentes}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-purple-500 shadow-lg">
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Produtos Ativos</span><span className="text-2xl">🛍️</span></div>
            <p className="text-3xl font-bold text-white">{statsLoading ? '...' : stats.produtosAtivos}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button onClick={() => router.push('/loja/pedidos')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">Gerenciar Pedidos</h3>
            <p className="text-gray-400">Kanban operacional e PDV</p>
          </button>

          <button onClick={() => router.push('/loja/produtos')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
            <h3 className="text-xl font-bold text-white mb-2">Produtos</h3>
            <p className="text-gray-400">Adicione e edite produtos do cardápio</p>
          </button>

          <button onClick={() => router.push('/loja/entregadores')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏍️</div>
            <h3 className="text-xl font-bold text-white mb-2">Entregadores</h3>
            <p className="text-gray-400">Cadastre sua equipe de entrega</p>
          </button>

          <button onClick={() => router.push('/loja/configuracoes')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Configurações</h3>
            <p className="text-gray-400">Taxas, horários e identidade</p>
          </button>

          <button onClick={() => router.push('/loja/financeiro')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💳</div>
            <h3 className="text-xl font-bold text-white mb-2">Financeiro</h3>
            <p className="text-gray-400">Extrato de vendas e pagamentos</p>
          </button>

          <button onClick={() => router.push('/loja/promocoes')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎁</div>
            <h3 className="text-xl font-bold text-white mb-2">Promoções</h3>
            <p className="text-gray-400">Crie cupons de desconto</p>
          </button>

          <button onClick={() => router.push('/loja/relatorios')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Relatórios</h3>
            <p className="text-gray-400">Gráficos e desempenho</p>
          </button>

          <button onClick={() => router.push('/loja/clientes')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Meus Clientes</h3>
            <p className="text-gray-400">Base de contatos e histórico</p>
          </button>

          <button onClick={() => router.push('/loja/automacao')} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors text-left group border border-gray-700 hover:border-primary">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">Robô & Automação</h3>
            <p className="text-gray-400">Configure mensagens e sons</p>
          </button>
        </div>
      </div>
    </div>
  )
}