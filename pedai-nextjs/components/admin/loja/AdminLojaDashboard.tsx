'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  pedidosHoje: number
  receitaHoje: number
  pedidosPendentes: number
  produtosAtivos: number
}

interface AdminLojaDashboardProps {
  lojaId: string
}

export default function AdminLojaDashboard({ lojaId }: AdminLojaDashboardProps) {
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
    checkAuthAndLoadStats()
  }, [lojaId])

  const checkAuthAndLoadStats = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('user_id', user.id)
      .single()

    if (!perfil || perfil.tipo !== 'admin') {
      router.push('/')
      return
    }

    // Get loja data by ID
    const { data: lojaData } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', lojaId)
      .single()

    if (!lojaData) {
      console.error('Loja não encontrada')
      router.push('/admin/dashboard')
      return
    }

    setLoja(lojaData)
    
    // Load real stats from database
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Count pedidos hoje
    const { count: pedidosHojeCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaData.id)
      .gte('created_at', todayISO)

    // Sum receita hoje
    const { data: pedidosHoje } = await supabase
      .from('pedidos')
      .select('total')
      .eq('loja_id', lojaData.id)
      .gte('created_at', todayISO)
      .not('status', 'eq', 'cancelado')

    const receitaHoje = pedidosHoje?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

    // Count pendentes
    const { count: pendentesCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaData.id)
      .in('status', ['pendente', 'aceito', 'preparando', 'pronto'])

    // Count produtos ativos
    const { count: produtosCount } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaData.id)
      .eq('disponivel', true)

    setStats({
      pedidosHoje: pedidosHojeCount || 0,
      receitaHoje: receitaHoje,
      pedidosPendentes: pendentesCount || 0,
      produtosAtivos: produtosCount || 0,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Voltar ao Painel Admin
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{loja.nome_loja}</h1>
            <p className="text-gray-600">{loja.municipio} - Dashboard de Gerenciamento (Admin)</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pedidos Hoje</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pedidosHoje}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Receita Hoje</p>
            <p className="text-3xl font-bold text-green-600">R$ {stats.receitaHoje.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pedidos Pendentes</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pedidosPendentes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Produtos Ativos</p>
            <p className="text-3xl font-bold text-blue-600">{stats.produtosAtivos}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href={`/admin/loja/${lojaId}/pedidos`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-blue-500"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gerenciar Pedidos</h3>
            <p className="text-gray-600">Visualize e atualize os pedidos desta loja</p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300 opacity-50">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gerenciar Produtos</h3>
            <p className="text-gray-600">Em desenvolvimento</p>
          </div>
        </div>
      </div>
    </div>
  )
}
