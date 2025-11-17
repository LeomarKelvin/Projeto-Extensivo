'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Usuario {
  id: string
  nome: string
  email: string
  tipo: string
  telefone: string | null
  bloqueado: boolean
  motivo_bloqueio: string | null
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadUsuarios()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [usuarios, filterTipo, filterStatus, searchTerm])

  const loadUsuarios = async () => {
    const supabase = createClient()
    
    const { data: perfis } = await supabase
      .from('perfis')
      .select('user_id, nome, tipo, telefone, bloqueado, motivo_bloqueio')
      .order('nome')

    if (perfis) {
      const usuariosData: Usuario[] = []
      
      for (const perfil of perfis) {
        const { data: { user } } = await supabase.auth.admin.getUserById(perfil.user_id)
        
        if (user) {
          usuariosData.push({
            id: perfil.user_id,
            nome: perfil.nome || 'Sem nome',
            email: user.email || 'Sem email',
            tipo: perfil.tipo,
            telefone: perfil.telefone,
            bloqueado: perfil.bloqueado || false,
            motivo_bloqueio: perfil.motivo_bloqueio
          })
        }
      }
      
      setUsuarios(usuariosData)
    }
    
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...usuarios]
    
    if (filterTipo !== 'todos') {
      filtered = filtered.filter(u => u.tipo === filterTipo)
    }
    
    if (filterStatus === 'ativos') {
      filtered = filtered.filter(u => !u.bloqueado)
    } else if (filterStatus === 'bloqueados') {
      filtered = filtered.filter(u => u.bloqueado)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredUsuarios(filtered)
  }

  const handleBlock = (user: Usuario) => {
    setSelectedUser(user)
    setMotivoBloqueio('')
    setShowBlockModal(true)
  }

  const handleUnblock = async (user: Usuario) => {
    const supabase = createClient()
    
    await supabase
      .from('perfis')
      .update({ bloqueado: false, motivo_bloqueio: null })
      .eq('user_id', user.id)
    
    loadUsuarios()
  }

  const confirmBlock = async () => {
    if (!selectedUser || !motivoBloqueio.trim()) return
    
    const supabase = createClient()
    
    await supabase
      .from('perfis')
      .update({ bloqueado: true, motivo_bloqueio: motivoBloqueio })
      .eq('user_id', selectedUser.id)
    
    setShowBlockModal(false)
    setSelectedUser(null)
    setMotivoBloqueio('')
    loadUsuarios()
  }

  const handleResetPassword = async (user: Usuario) => {
    if (confirm(`Enviar email de recuperação de senha para ${user.email}?`)) {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(user.email)
      alert('Email de recuperação enviado!')
    }
  }

  const handleViewDetails = (user: Usuario) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Usuário</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="cliente">Clientes</option>
              <option value="loja">Lojas</option>
              <option value="entregador">Entregadores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="bloqueados">Bloqueados</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Buscar por Nome/Email</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Total de Usuários</p>
          <p className="text-2xl font-bold text-white">{usuarios.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Ativos</p>
          <p className="text-2xl font-bold text-green-500">{usuarios.filter(u => !u.bloqueado).length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Bloqueados</p>
          <p className="text-2xl font-bold text-red-500">{usuarios.filter(u => u.bloqueado).length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-400">Resultados Filtrados</p>
          <p className="text-2xl font-bold text-blue-500">{filteredUsuarios.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{usuario.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{usuario.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.tipo === 'admin' ? 'bg-purple-600 text-white' :
                      usuario.tipo === 'loja' ? 'bg-blue-600 text-white' :
                      usuario.tipo === 'entregador' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {usuario.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{usuario.telefone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {usuario.bloqueado ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-600 text-white">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600 text-white">
                        Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(usuario)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                        title="Ver detalhes"
                      >
                        Ver
                      </button>
                      
                      {usuario.bloqueado ? (
                        <button
                          onClick={() => handleUnblock(usuario)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                          title="Desbloquear"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(usuario)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                          title="Bloquear"
                        >
                          Bloquear
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleResetPassword(usuario)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition"
                        title="Resetar senha"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Bloquear Usuário</h3>
            
            <p className="text-gray-300 mb-4">
              Você está prestes a bloquear <strong>{selectedUser.nome}</strong>.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Motivo do Bloqueio *
              </label>
              <textarea
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Descreva o motivo do bloqueio..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmBlock}
                disabled={!motivoBloqueio.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
              >
                Confirmar Bloqueio
              </button>
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Detalhes do Usuário</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Nome</p>
                <p className="text-white font-medium">{selectedUser.nome}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Tipo</p>
                <p className="text-white font-medium capitalize">{selectedUser.tipo}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Telefone</p>
                <p className="text-white font-medium">{selectedUser.telefone || 'Não informado'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-white font-medium">
                  {selectedUser.bloqueado ? 'Bloqueado' : 'Ativo'}
                </p>
              </div>
              
              {selectedUser.bloqueado && selectedUser.motivo_bloqueio && (
                <div>
                  <p className="text-sm text-gray-400">Motivo do Bloqueio</p>
                  <p className="text-white font-medium">{selectedUser.motivo_bloqueio}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
