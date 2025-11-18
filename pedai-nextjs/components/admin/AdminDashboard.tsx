'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  totalLojas: number
  totalPedidos: number
  totalClientes: number
  receitaTotal: number
}

interface Loja {
  id: number
  nome_loja: string
  municipio: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalLojas: 0,
    totalPedidos: 0,
    totalClientes: 0,
    receitaTotal: 0,
  })
  const [lojas, setLojas] = useState<Loja[]>([])

  useEffect(() => {
    checkAuthAndLoadStats()
  }, [])

  const checkAuthAndLoadStats = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get profile via API (bypasses RLS)
    const profileResponse = await fetch('/api/auth/get-profile')
    const profileData = await profileResponse.json()

    if (!profileResponse.ok || !profileData.perfil || profileData.perfil.tipo !== 'admin') {
      router.push('/')
      return
    }

    // Load platform stats
    const { count: lojasCount } = await supabase
      .from('lojas')
      .select('*', { count: 'exact', head: true })

    const { count: pedidosCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })

    const { count: clientesCount } = await supabase
      .from('perfis')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'cliente')

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('total')
      .not('status', 'eq', 'cancelado')

    const receitaTotal = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

    // Load all lojas
    const { data: lojasData } = await supabase
      .from('lojas')
      .select('id, nome_loja, municipio')
      .order('municipio')

    setStats({
      totalLojas: lojasCount || 0,
      totalPedidos: pedidosCount || 0,
      totalClientes: clientesCount || 0,
      receitaTotal: receitaTotal,
    })

    setLojas(lojasData || [])
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">Visão geral da plataforma PedeAí</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Lojas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLojas}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pedidos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPedidos}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClientes}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {stats.receitaTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-500">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Área de Lojistas</h3>
                <p className="text-sm text-gray-600">Gerenciar pedidos e produtos</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">Selecione uma loja para gerenciar:</p>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = `/admin/loja/${e.target.value}/dashboard`
                }
              }}
            >
              <option value="">Escolher loja...</option>
              {lojas.map((loja) => (
                <option key={loja.id} value={loja.id}>
                  {loja.nome_loja} - {loja.municipio}
                </option>
              ))}
            </select>
          </div>

          <Link href="/alagoa-nova" className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-yellow-500">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Área de Clientes</h3>
                <p className="text-sm text-gray-600">Navegar como cliente</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Visualize a plataforma como um cliente nos municípios</p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300 opacity-50">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Área de Entregadores</h3>
                <p className="text-sm text-gray-600">Em breve</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Funcionalidade em desenvolvimento</p>
          </div>
        </div>

        {/* Lojas por Município */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lojas Cadastradas</h2>
          <div className="space-y-4">
            {['Alagoa Nova', 'Esperança', 'Lagoa Seca'].map((municipio) => {
              const lojasDoMunicipio = lojas.filter(l => l.municipio === municipio)
              return (
                <div key={municipio} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{municipio}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lojasDoMunicipio.length > 0 ? (
                      lojasDoMunicipio.map((loja) => (
                        <div key={loja.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {loja.nome_loja}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">Nenhuma loja cadastrada</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
