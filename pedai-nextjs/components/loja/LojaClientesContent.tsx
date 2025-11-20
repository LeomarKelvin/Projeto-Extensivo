'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ClienteResumo {
  id: string // ID do perfil ou chave única
  nome: string
  telefone: string
  email: string
  total_gasto: number
  qtd_pedidos: number
  ultima_compra: string
}

export default function LojaClientesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [busca, setBusca] = useState('')
  const [lojaId, setLojaId] = useState<number | null>(null)
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

    const { data: loja } = await supabase.from('lojas').select('id, nome_loja').eq('user_id', user.id).single()
    
    if (loja) {
      setLojaId(loja.id)
      setLojaNome(loja.nome_loja)
      
      // Buscar todos os pedidos da loja para montar o CRM
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select(`
          id, total, created_at, cliente_nome, cliente_telefone,
          perfil:perfis(id, nome_completo, telefone, email)
        `)
        .eq('loja_id', loja.id)
        .neq('status', 'cancelado') // Ignorar cancelados no cálculo de valor
        .order('created_at', { ascending: false })

      if (pedidos) {
        processarClientes(pedidos)
      }
    }
    setLoading(false)
  }

  const processarClientes = (pedidos: any[]) => {
    const mapaClientes = new Map<string, ClienteResumo>()

    pedidos.forEach(p => {
      // Tenta identificar o cliente (Perfil > Nome Avulso > "Desconhecido")
      let idUnico = ''
      let nome = 'Cliente Desconhecido'
      let telefone = ''
      let email = ''

      if (p.perfil) {
        // Cliente cadastrado no app
        idUnico = `perfil-${p.perfil.id}`
        nome = p.perfil.nome_completo
        telefone = p.perfil.telefone || ''
        email = p.perfil.email || ''
      } else {
        // Cliente avulso (PDV)
        // Usa o nome+telefone como chave única
        nome = p.cliente_nome || 'Cliente Balcão'
        telefone = p.cliente_telefone || ''
        idUnico = `pdv-${nome}-${telefone}`
      }

      // Se não tiver telefone, não adianta muito pro CRM, mas mantemos na lista
      
      const atual = mapaClientes.get(idUnico) || {
        id: idUnico,
        nome,
        telefone,
        email,
        total_gasto: 0,
        qtd_pedidos: 0,
        ultima_compra: p.created_at // Como ordenamos por data desc, o primeiro que aparecer é o último
      }

      // Atualiza totais (soma acumulada)
      atual.total_gasto += p.total
      atual.qtd_pedidos += 1
      
      // A data da última compra é a mais recente encontrada (a primeira do loop)
      // Se já existe no mapa, mantém a data que já estava (que é mais recente)
      if (!mapaClientes.has(idUnico)) {
        atual.ultima_compra = p.created_at
      }

      mapaClientes.set(idUnico, atual)
    })

    // Converte Mapa para Array e ordena por última compra
    setClientes(Array.from(mapaClientes.values()))
  }

  const falarNoZap = (cliente: ClienteResumo) => {
    if (!cliente.telefone) return alert('Cliente sem telefone cadastrado.')
    
    // Limpa o número
    const num = cliente.telefone.replace(/\D/g, '')
    const texto = `Olá ${cliente.nome}, aqui é do ${lojaNome}! Tudo bem? 😃`
    
    window.open(`https://api.whatsapp.com/send?phone=55${num}&text=${encodeURIComponent(texto)}`, '_blank')
  }

  // Filtro de busca
  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando clientes...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
            <div>
              <h1 className="text-3xl font-bold text-white">Meus Clientes</h1>
              <p className="text-gray-400 text-sm">Histórico e contato direto</p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <input 
              placeholder="🔍 Buscar por nome ou telefone..." 
              className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4 text-center">Pedidos</th>
                  <th className="p-4 text-right">Total Gasto</th>
                  <th className="p-4 text-right">Última Compra</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-700/30 transition-colors group">
                      <td className="p-4">
                        <p className="font-bold text-white">{cliente.nome}</p>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                          {cliente.id.startsWith('pdv') ? 'Presencial/Tel' : 'App PedeAí'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {cliente.telefone || '---'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
                          {cliente.qtd_pedidos}
                        </span>
                      </td>
                      <td className="p-4 text-right text-green-400 font-bold">
                        R$ {cliente.total_gasto.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-sm text-gray-400">
                        {new Date(cliente.ultima_compra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-center">
                        {cliente.telefone ? (
                          <button 
                            onClick={() => falarNoZap(cliente)}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-transform hover:scale-110"
                            title="Chamar no WhatsApp"
                          >
                            💬
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">Sem zap</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 text-center text-gray-500 text-xs">
          <p>* A lista inclui clientes cadastrados no app e clientes lançados via PDV.</p>
        </div>

      </div>
    </div>
  )
}