'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ClienteResumo {
  id: string
  nome: string
  telefone: string
  email: string
  total_gasto: number
  qtd_pedidos: number
  ultima_compra: string
  origem: 'App' | 'PDV'
}

export default function LojaClientesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [busca, setBusca] = useState('')
  const [lojaNome, setLojaNome] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: loja } = await supabase
      .from('lojas')
      .select('id, nome_loja')
      .eq('user_id', user.id)
      .single()
    
    if (loja) {
      setLojaNome(loja.nome_loja)
      
      // Busca todos os pedidos não cancelados
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select(`
          id, total, created_at, cliente_nome, cliente_telefone,
          perfil:perfis(id, nome_completo, telefone, email)
        `)
        .eq('loja_id', loja.id)
        .neq('status', 'cancelado')
        .order('created_at', { ascending: false })

      if (pedidos) {
        processarClientes(pedidos)
      }
    }
    setLoading(false)
  }

  const processarClientes = (pedidos: any[]) => {
    const mapa = new Map<string, ClienteResumo>()

    pedidos.forEach(p => {
      // Define a chave única e os dados base
      let key = ''
      let dados: Partial<ClienteResumo> = {}

      if (p.perfil) {
        // Cliente do App (Logado)
        key = `app-${p.perfil.id}`
        dados = {
          id: key,
          nome: p.perfil.nome_completo,
          telefone: p.perfil.telefone || '',
          email: p.perfil.email || '',
          origem: 'App'
        }
      } else {
        // Cliente do PDV (Avulso)
        // Usa telefone como chave principal, ou nome se não tiver telefone
        const tel = p.cliente_telefone?.replace(/\D/g, '') || ''
        const nome = p.cliente_nome || 'Cliente Balcão'
        key = tel ? `pdv-tel-${tel}` : `pdv-nome-${nome.toLowerCase().trim()}`
        
        dados = {
          id: key,
          nome: nome,
          telefone: p.cliente_telefone || '',
          email: '',
          origem: 'PDV'
        }
      }

      // Se já existe, atualiza. Se não, cria.
      const atual = mapa.get(key) || {
        ...dados,
        total_gasto: 0,
        qtd_pedidos: 0,
        ultima_compra: p.created_at // Inicializa com a data deste pedido
      } as ClienteResumo

      // Acumula valores
      atual.total_gasto += p.total
      atual.qtd_pedidos += 1
      
      // Mantém sempre a data mais recente (pedidos já vêm ordenados, mas garantimos)
      if (new Date(p.created_at) > new Date(atual.ultima_compra)) {
        atual.ultima_compra = p.created_at
      }

      mapa.set(key, atual)
    })

    // Converte para array e ordena por última compra (mais recentes primeiro)
    const listaFinal = Array.from(mapa.values()).sort((a, b) => 
      new Date(b.ultima_compra).getTime() - new Date(a.ultima_compra).getTime()
    )

    setClientes(listaFinal)
  }

  const enviarZap = (cliente: ClienteResumo) => {
    if (!cliente.telefone) return alert('Cliente sem telefone cadastrado.')
    
    const num = cliente.telefone.replace(/\D/g, '')
    const msg = `Olá ${cliente.nome}, aqui é do ${lojaNome}! Tudo bem? 😃`
    
    window.open(`https://api.whatsapp.com/send?phone=55${num}&text=${encodeURIComponent(msg)}`, '_blank')
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando base de clientes...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Meus Clientes</h1>
              <p className="text-gray-400 text-sm">Gestão de relacionamento e histórico</p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <input 
              placeholder="🔍 Buscar por nome ou telefone..." 
              className="w-full md:w-72 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-400 text-xs">Total Clientes</p>
            <p className="text-2xl font-bold text-white">{clientes.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-gray-400 text-xs">Vendas Totais (LTV)</p>
            <p className="text-2xl font-bold text-white">R$ {clientes.reduce((acc, c) => acc + c.total_gasto, 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 hidden md:table-cell">Contato</th>
                  <th className="p-4 text-center">Pedidos</th>
                  <th className="p-4 text-right">Total Gasto</th>
                  <th className="p-4 text-right hidden md:table-cell">Última Compra</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                  </tr>
                ) : (
                  clientesFiltrados.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-700/30 transition-colors group">
                      <td className="p-4">
                        <p className="font-bold text-white">{c.nome}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${c.origem === 'App' ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                          {c.origem}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                        {c.telefone || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs font-bold">
                          {c.qtd_pedidos}
                        </span>
                      </td>
                      <td className="p-4 text-right text-green-400 font-bold">
                        R$ {c.total_gasto.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-sm text-gray-400 hidden md:table-cell">
                        {new Date(c.ultima_compra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-center">
                        {c.telefone ? (
                          <button 
                            onClick={() => enviarZap(c)}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-transform hover:scale-110 shadow-lg"
                            title="Conversar no WhatsApp"
                          >
                            💬
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">--</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}