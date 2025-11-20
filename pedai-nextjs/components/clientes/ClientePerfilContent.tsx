'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TenantConfig } from '@/lib/types/tenant'
import { useAuth } from '@/lib/contexts/AuthContext'

interface Endereco {
  id: number
  apelido: string
  rua: string
  numero: string
  bairro: string
  complemento: string
  referencia: string
  cidade: string
  uf: string
  principal: boolean
}

interface PerfilContentProps {
  tenant: TenantConfig
}

export default function ClientePerfilContent({ tenant }: PerfilContentProps) {
  const router = useRouter()
  const { user, refreshAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'enderecos' | 'seguranca'>('dados')

  // Estado para Notificações (Toast)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Dados do Perfil
  const [perfilData, setPerfilData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: ''
  })

  // Dados de Endereços
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)

  const [novoEndereco, setNovoEndereco] = useState({
    apelido: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
    cidade: tenant.name,
    uf: 'PB'
  })

  // Dados de Senha (AGORA COM SENHA ATUAL)
  const [senhaData, setSenhaData] = useState({ 
    atual: '', 
    nova: '', 
    confirmacao: '' 
  })

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    const supabase = createClient()

    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (perfil) {
      setPerfilData({
        nome_completo: perfil.nome_completo || '',
        email: perfil.email || user.email || '',
        telefone: perfil.telefone || '',
        cpf: perfil.cpf || '',
        data_nascimento: perfil.data_nascimento || ''
      })
    }
    loadEnderecos()
    setLoading(false)
  }

  const loadEnderecos = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('cliente_enderecos')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: true })
    
    if (data) setEnderecos(data)
  }

  const formatarTelefone = (v: string) => {
    return v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15)
  }

  const formatarCPF = (v: string) => {
    return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  }

  const handleSavePerfil = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    
    const updates = {
      user_id: user.id,
      email: user.email,
      nome_completo: perfilData.nome_completo,
      telefone: perfilData.telefone,
      cpf: perfilData.cpf,
      data_nascimento: perfilData.data_nascimento || null,
      updated_at: new Date().toISOString(),
      tipo: 'cliente'
    }

    const { error } = await supabase.from('perfis').upsert(updates, { onConflict: 'user_id' })
    setSaving(false)

    if (error) notify('Erro ao salvar: ' + error.message, 'error')
    else {
      notify('Dados atualizados com sucesso! ✅', 'success')
      refreshAuth()
    }
  }

  const handleSaveEndereco = async () => {
    if (!novoEndereco.rua || !novoEndereco.numero || !novoEndereco.bairro) {
      return notify('Preencha Rua, Número e Bairro.', 'error')
    }

    const supabase = createClient()
    let error

    const payload = {
      user_id: user.id,
      ...novoEndereco,
      principal: enderecos.length === 0
    }

    if (editingAddressId) {
      const { error: updateError } = await supabase.from('cliente_enderecos').update(payload).eq('id', editingAddressId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('cliente_enderecos').insert(payload)
      error = insertError
    }

    if (error) notify('Erro ao salvar endereço: ' + error.message, 'error')
    else {
      setShowAddressModal(false)
      loadEnderecos()
      notify(editingAddressId ? 'Endereço atualizado!' : 'Endereço adicionado!', 'success')
    }
  }

  const handleDeleteEndereco = async (id: number) => {
    const supabase = createClient()
    await supabase.from('cliente_enderecos').delete().eq('id', id)
    loadEnderecos()
    notify('Endereço removido.', 'success')
  }

  const setEnderecoPrincipal = async (id: number) => {
    const supabase = createClient()
    await supabase.from('cliente_enderecos').update({ principal: false }).eq('user_id', user.id)
    await supabase.from('cliente_enderecos').update({ principal: true }).eq('id', id)
    loadEnderecos()
    notify('Endereço principal atualizado.', 'success')
  }

  // --- ALTERAR SENHA COM VERIFICAÇÃO ---
  const handleUpdatePassword = async () => {
    if (!senhaData.atual) return notify('Informe sua senha atual.', 'error')
    if (senhaData.nova !== senhaData.confirmacao) return notify('As novas senhas não conferem.', 'error')
    if (senhaData.nova.length < 6) return notify('A senha deve ter no mínimo 6 caracteres.', 'error')

    setSaving(true)
    const supabase = createClient()

    // 1. Verifica se a senha atual está correta (Tenta logar de novo)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senhaData.atual
    })

    if (loginError) {
      setSaving(false)
      return notify('Senha atual incorreta.', 'error')
    }

    // 2. Se passou, atualiza para a nova
    const { error } = await supabase.auth.updateUser({ password: senhaData.nova })
    
    setSaving(false)
    if (error) notify('Erro ao atualizar senha: ' + error.message, 'error')
    else {
      notify('Senha alterada com sucesso! 🔒', 'success')
      setSenhaData({ atual: '', nova: '', confirmacao: '' })
    }
  }

  const openEditAddress = (end: Endereco) => {
    setNovoEndereco({
      apelido: end.apelido || '',
      rua: end.rua,
      numero: end.numero,
      bairro: end.bairro,
      complemento: end.complemento || '',
      referencia: end.referencia || '',
      cidade: end.cidade || tenant.name,
      uf: end.uf || 'PB'
    })
    setEditingAddressId(end.id)
    setShowAddressModal(true)
  }

  const openNewAddress = () => {
    setNovoEndereco({ apelido: '', rua: '', numero: '', bairro: '', complemento: '', referencia: '', cidade: tenant.name, uf: 'PB' })
    setEditingAddressId(null)
    setShowAddressModal(true)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando perfil...</div>

  return (
    <div className="min-h-screen bg-gray-900 pb-20 relative">
      
      <div className="bg-gray-800 border-b border-gray-700 pt-8 pb-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
          <p className="text-gray-400">Mantenha seus dados atualizados para agilizar seus pedidos.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        
        <div className="flex gap-4 border-b border-gray-700 mb-8 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('dados')} className={`pb-3 px-2 font-bold transition-colors whitespace-nowrap ${activeTab === 'dados' ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-gray-400 hover:text-white'}`}>👤 Dados Pessoais</button>
          <button onClick={() => setActiveTab('enderecos')} className={`pb-3 px-2 font-bold transition-colors whitespace-nowrap ${activeTab === 'enderecos' ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-gray-400 hover:text-white'}`}>📍 Meus Endereços</button>
          <button onClick={() => setActiveTab('seguranca')} className={`pb-3 px-2 font-bold transition-colors whitespace-nowrap ${activeTab === 'seguranca' ? 'text-tenant-primary border-b-2 border-tenant-primary' : 'text-gray-400 hover:text-white'}`}>🔒 Segurança</button>
        </div>

        {activeTab === 'dados' && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="block text-gray-400 text-sm mb-2">Nome Completo</label><input value={perfilData.nome_completo} onChange={e => setPerfilData({...perfilData, nome_completo: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" /></div>
              <div><label className="block text-gray-400 text-sm mb-2">E-mail</label><input value={perfilData.email} disabled className="w-full bg-gray-900/50 text-gray-500 p-3 rounded-lg border border-gray-700 cursor-not-allowed" /></div>
              <div><label className="block text-gray-400 text-sm mb-2">Telefone / WhatsApp</label><input value={perfilData.telefone} onChange={e => setPerfilData({...perfilData, telefone: formatarTelefone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" /></div>
              <div><label className="block text-gray-400 text-sm mb-2">CPF</label><input value={perfilData.cpf} onChange={e => setPerfilData({...perfilData, cpf: formatarCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" /></div>
              <div><label className="block text-gray-400 text-sm mb-2">Data de Nascimento</label><input type="date" value={perfilData.data_nascimento} onChange={e => setPerfilData({...perfilData, data_nascimento: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" /></div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={handleSavePerfil} disabled={saving} className="bg-tenant-primary text-tenant-secondary font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </div>
        )}

        {activeTab === 'enderecos' && (
          <div className="animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={openNewAddress} className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white hover:border-tenant-primary hover:bg-gray-800 transition-all min-h-[160px]">
                <span className="text-4xl">+</span><span className="font-bold">Adicionar Endereço</span>
              </button>
              {enderecos.map(end => (
                <div key={end.id} className={`bg-gray-800 rounded-xl p-6 border relative group transition-all ${end.principal ? 'border-tenant-primary shadow-lg' : 'border-gray-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {end.apelido || 'Endereço'}
                      {end.principal && <span className="text-[10px] bg-tenant-primary text-tenant-secondary px-2 py-0.5 rounded-full font-bold">Principal</span>}
                    </h3>
                    <div className="flex gap-2">
                      {!end.principal && <button onClick={() => setEnderecoPrincipal(end.id)} className="text-xs text-gray-400 hover:text-white underline">Definir Principal</button>}
                      <button onClick={() => openEditAddress(end)} className="text-gray-400 hover:text-white p-1">✏️</button>
                      <button onClick={() => handleDeleteEndereco(end.id)} className="text-red-500 hover:text-red-400 p-1">🗑️</button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{end.rua}, {end.numero}</p>
                  <p className="text-gray-400 text-xs mt-1">{end.bairro} {end.complemento ? `- ${end.complemento}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: SEGURANÇA (ATUALIZADA) */}
        {activeTab === 'seguranca' && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-md animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-6">Alterar Senha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Senha Atual</label>
                <input 
                  type="password" 
                  value={senhaData.atual} 
                  onChange={e => setSenhaData({...senhaData, atual: e.target.value})} 
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" 
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nova Senha</label>
                <input 
                  type="password" 
                  value={senhaData.nova} 
                  onChange={e => setSenhaData({...senhaData, nova: e.target.value})} 
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" 
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={senhaData.confirmacao} 
                  onChange={e => setSenhaData({...senhaData, confirmacao: e.target.value})} 
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-tenant-primary outline-none" 
                />
              </div>
              <button onClick={handleUpdatePassword} disabled={saving} className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors mt-4">{saving ? 'Verificando e Alterando...' : 'Atualizar Senha'}</button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Endereço */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{editingAddressId ? 'Editar Endereço' : 'Novo Endereço'}</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-gray-400 text-xs mb-1">Apelido</label><input value={novoEndereco.apelido} onChange={e => setNovoEndereco({...novoEndereco, apelido: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="block text-gray-400 text-xs mb-1">Rua</label><input value={novoEndereco.rua} onChange={e => setNovoEndereco({...novoEndereco, rua: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
                <div><label className="block text-gray-400 text-xs mb-1">Número</label><input value={novoEndereco.numero} onChange={e => setNovoEndereco({...novoEndereco, numero: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-400 text-xs mb-1">Bairro</label><input value={novoEndereco.bairro} onChange={e => setNovoEndereco({...novoEndereco, bairro: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
                <div><label className="block text-gray-400 text-xs mb-1">Complemento</label><input value={novoEndereco.complemento} onChange={e => setNovoEndereco({...novoEndereco, complemento: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
              </div>
              <div><label className="block text-gray-400 text-xs mb-1">Ref.</label><input value={novoEndereco.referencia} onChange={e => setNovoEndereco({...novoEndereco, referencia: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-tenant-primary outline-none" /></div>
              <button onClick={handleSaveEndereco} className="w-full bg-tenant-primary text-tenant-secondary font-bold py-3 rounded-lg hover:opacity-90 mt-4">{editingAddressId ? 'Atualizar Endereço' : 'Salvar Endereço'}</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO TOAST */}
      {showToast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up border ${toastType === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-green-600 border-green-400 text-white'}`}>
          <div className={`rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm ${toastType === 'error' ? 'bg-white text-red-600' : 'bg-white text-green-600'}`}>{toastType === 'error' ? '!' : '✓'}</div>
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

    </div>
  )
}