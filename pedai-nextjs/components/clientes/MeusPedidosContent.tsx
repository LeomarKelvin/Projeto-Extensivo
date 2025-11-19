'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TenantConfig } from '@/lib/types/tenant'

interface MeusPedidosContentProps {
  tenant: TenantConfig
}

interface Pedido {
  id: number
  status: string
  total: number
  created_at: string
  lojas: { nome_loja: string; url_imagem?: string } | null
  pedido_itens: Array<{
    quantidade: number
    produto: {
      nome: string
    } | null
  }>
}

// MUDANÇA AQUI: Cor do 'entregue' atualizada para verde
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pendente: { label: 'Aguardando Confirmação', color: 'text-yellow-400', bg: 'bg-yellow-400/10', step: 1 },
  aceito: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10', step: 2 },
  preparando: { label: 'Em Preparação', color: 'text-blue-400', bg: 'bg-blue-400/10', step: 2 },
  pronto: { label: 'Pronto para Entrega', color: 'text-green-400', bg: 'bg-green-400/10', step: 3 },
  em_entrega: { label: 'Saiu para Entrega', color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 4 },
  entregue: { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-400/10', step: 5 }, // <-- FICOU VERDE!
  cancelado: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-900/20', step: 0 },
}

export default function MeusPedidosContent({ tenant }: MeusPedidosContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [perfilId, setPerfilId] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/${tenant.slug}/auth/login?redirect=/${tenant.slug}/meus-pedidos`)
        return
      }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!perfil) return
      
      if (perfil.tipo === 'loja') {
        router.push('/loja/dashboard')
        return
      }

      setPerfilId(perfil.id)

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id, status, total, created_at,
          lojas ( nome_loja, url_imagem ),
          pedido_itens ( 
            quantidade,
            produto:produtos ( nome ) 
          )
        `)
        .eq('perfil_id', perfil.id)
        .order('created_at', { ascending: false })

      if (!pedidosError) {
        const pedidosFormatados = (pedidosData || []).map((p: any) => ({
          ...p,
          lojas: Array.isArray(p.lojas) ? p.lojas[0] : p.lojas
        }))
        setPedidos(pedidosFormatados)
      }

      setLoading(false)
    }

    loadData()
  }, [tenant.slug, router])

  // Realtime
  useEffect(() => {
    if (!perfilId) return

    const supabase = createClient()
    const channel = supabase
      .channel('meus-pedidos-cliente')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `perfil_id=eq.${perfilId}`
        },
        (payload) => {
          setPedidos((current) => 
            current.map((p) => 
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [perfilId])

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${tenant.slug}`} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold text-white">Meus Pedidos</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {pedidos.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-400 mb-6">Seus pedidos recentes aparecerão aqui.</p>
            <Link href={`/${tenant.slug}/lojas`} className="px-6 py-3 bg-tenant-primary text-tenant-secondary rounded-lg font-bold hover:opacity-90 transition-opacity">
              Fazer um Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => {
              const status = STATUS_CONFIG[pedido.status] || STATUS_CONFIG['pendente']
              const data = new Date(pedido.created_at).toLocaleDateString('pt-BR')
              const progress = status.step > 0 ? Math.min((status.step / 4) * 100, 100) : 0

              return (
                <div key={pedido.id} className="rounded-xl border border-gray-700 overflow-hidden bg-gray-800 shadow-lg transition-all hover:border-gray-600">
                  
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                         {pedido.lojas?.url_imagem ? (
                           <img src={pedido.lojas.url_imagem} className="w-full h-full object-cover" />
                         ) : '🏪'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{pedido.lojas?.nome_loja || 'Loja'}</h3>
                        <p className="text-gray-500 text-xs">#{pedido.id} • {data}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${status.color} ${status.bg} border-current`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                    <div className="px-4 pb-4">
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-tenant-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-gray-300 space-y-1">
                         {pedido.pedido_itens?.map((item, i) => (
                           <div key={i} className="line-clamp-1">
                             <span className="text-tenant-primary font-bold">{item.quantidade}x</span> {item.produto?.nome || 'Item indisponível'}
                           </div>
                         ))}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">R$ {pedido.total ? pedido.total.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 text-center border-t border-gray-700/50">
                    <Link href={`/${tenant.slug}/pedido/${pedido.id}`} className="text-sm text-tenant-primary hover:underline font-medium">
                      Ver detalhes completos
                    </Link>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}