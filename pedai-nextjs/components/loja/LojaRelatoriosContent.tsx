'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  faturamento: number
  pedidos: number
  ticketMedio: number
}

interface TopProduto {
  nome: string
  qtd: number
  total: number
}

interface VendaDiaria {
  data: string
  valor: number
}

export default function LojaRelatoriosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7' | '30'>('7')
  const [stats, setStats] = useState<Stats>({ faturamento: 0, pedidos: 0, ticketMedio: 0 })
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([])
  const [graficoDados, setGraficoDados] = useState<VendaDiaria[]>([])

  useEffect(() => {
    loadRelatorios()
  }, [periodo])

  const formatarDataSimples = (dataISO: Date | string) => {
    const d = new Date(dataISO)
    const dia = d.getDate().toString().padStart(2, '0')
    const mes = (d.getMonth() + 1).toString().padStart(2, '0')
    return `${dia}/${mes}`
  }

  const loadRelatorios = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: loja } = await supabase.from('lojas').select('id').eq('user_id', user.id).single()
    
    if (loja) {
      const diasAtras = parseInt(periodo)
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasAtras)
      dataLimite.setHours(0, 0, 0, 0)

      const { data: pedidos } = await supabase
        .from('pedidos')
        .select(`
          id, total, created_at, status,
          pedido_itens (
            quantidade,
            preco_unitario,
            produto:produtos (nome)
          )
        `)
        .eq('loja_id', loja.id)
        .neq('status', 'cancelado')
        .gte('created_at', dataLimite.toISOString())
        .order('created_at', { ascending: true })

      if (pedidos) {
        processarDados(pedidos, diasAtras)
      }
    }
    setLoading(false)
  }

  const processarDados = (pedidos: any[], dias: number) => {
    const faturamento = pedidos.reduce((acc, p) => acc + p.total, 0)
    const totalPedidos = pedidos.length
    const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0

    setStats({ faturamento, pedidos: totalPedidos, ticketMedio })

    const produtosMap = new Map<string, TopProduto>()
    pedidos.forEach(p => {
      p.pedido_itens?.forEach((item: any) => {
        const nome = item.produto?.nome || 'Item removido'
        const atual = produtosMap.get(nome) || { nome, qtd: 0, total: 0 }
        produtosMap.set(nome, {
          nome,
          qtd: atual.qtd + item.quantidade,
          total: atual.total + (item.quantidade * item.preco_unitario)
        })
      })
    })

    const ranking = Array.from(produtosMap.values())
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)

    setTopProdutos(ranking)

    const vendasMap = new Map<string, number>()
    const hoje = new Date()
    const diasArray = []

    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoje)
      d.setDate(d.getDate() - i)
      const key = formatarDataSimples(d)
      vendasMap.set(key, 0)
      diasArray.push(key)
    }

    pedidos.forEach(p => {
      const key = formatarDataSimples(p.created_at)
      if (vendasMap.has(key)) {
        vendasMap.set(key, (vendasMap.get(key) || 0) + p.total)
      }
    })

    const grafico = diasArray.map(data => ({
      data,
      valor: vendasMap.get(data) || 0
    }))

    setGraficoDados(grafico)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Calculando...</div>

  const maxValorGrafico = Math.max(...graficoDados.map(d => d.valor), 10)

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Relatórios</h1>
              <p className="text-gray-400 text-sm">Visão geral do seu negócio</p>
            </div>
          </div>

          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setPeriodo('7')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${periodo === '7' ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>7 Dias</button>
            <button onClick={() => setPeriodo('30')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${periodo === '30' ? 'bg-primary text-secondary' : 'text-gray-400 hover:text-white'}`}>30 Dias</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Faturamento Bruto</p>
            <h3 className="text-3xl font-bold text-green-400">R$ {stats.faturamento.toFixed(2)}</h3>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total de Pedidos</p>
            <h3 className="text-3xl font-bold text-blue-400">{stats.pedidos}</h3>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Ticket Médio</p>
            <h3 className="text-3xl font-bold text-yellow-400">R$ {stats.ticketMedio.toFixed(2)}</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* GRÁFICO HTML/CSS PURO (Sem SVG para evitar bugs de texto) */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Evolução de Vendas</h3>
            
            <div className="h-64 flex items-end gap-1 sm:gap-2 w-full">
              {graficoDados.map((dia, i) => {
                // Calcula altura percentual
                const altura = Math.max((dia.valor / maxValorGrafico) * 100, 2) // Mínimo 2%
                
                // Lógica para mostrar datas sem encavalar (ex: 1, 5, 10...)
                const mostrarData = periodo === '7' || i % 4 === 0 || i === graficoDados.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                    
                    {/* Tooltip Flutuante (HTML padrão, z-index alto) */}
                    <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded border border-gray-600 whitespace-nowrap z-20 shadow-xl pointer-events-none">
                      <p className="text-gray-400 text-[10px] mb-0.5">{dia.data}</p>
                      <p className="text-green-400">R$ {dia.valor.toFixed(2)}</p>
                      {/* Setinha do tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-600"></div>
                    </div>
                    
                    {/* Barra */}
                    <div 
                      className={`w-full rounded-t transition-all duration-300 ${dia.valor > 0 ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-700/30'}`}
                      style={{ height: `${altura}%` }}
                    ></div>
                    
                    {/* Data no Eixo X */}
                    <div className="h-6 relative w-full">
                      <span className={`absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap ${!mostrarData ? 'hidden' : 'block'}`}>
                        {dia.data}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">🏆 Top Produtos</h3>
            <div className="space-y-4">
              {topProdutos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sem dados.</p>
              ) : (
                topProdutos.map((prod, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-white font-medium text-sm line-clamp-1">{prod.nome}</p>
                        <p className="text-xs text-gray-400">{prod.qtd} vendidos</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-sm">R$ {prod.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}