'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'
import type { TenantConfig } from '@/lib/types/tenant'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'

interface CheckoutContentProps {
  tenant: TenantConfig
}

interface EnderecoSalvo {
  id: number
  apelido: string
  rua: string
  numero: string
  bairro: string
  complemento: string
  referencia: string
}

export default function CheckoutContent({ tenant }: CheckoutContentProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth() // Usa o contexto para pegar o user rápido
  
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Endereços
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([])
  const [usarEnderecoSalvo, setUsarEnderecoSalvo] = useState<number | null>(null)
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(false)

  // Configurações da Loja
  const [opcoesPagamento, setOpcoesPagamento] = useState({
    dinheiro: true,
    pix: true,
    cartao: true
  })

  const [formData, setFormData] = useState({
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
    formaPagamento: '',
    trocoPara: '',
    observacoes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 1. Verifica Auth e Busca Endereços
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        sessionStorage.setItem('redirectAfterLogin', `/${tenant.slug}/checkout`)
        router.push(`/${tenant.slug}/auth/login`)
        return
      }
      
      setCheckingAuth(false)

      // Busca endereços salvos
      const { data: ends } = await supabase
        .from('cliente_enderecos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('principal', { ascending: false }) // Principal primeiro
      
      if (ends && ends.length > 0) {
        setEnderecosSalvos(ends)
        // Seleciona o primeiro (principal) automaticamente
        selecionarEndereco(ends[0])
      }
    }
    init()
  }, [router, tenant])

  // 2. Busca Config da Loja
  useEffect(() => {
    if (items.length === 0) return
    const fetchLojaConfig = async () => {
      const supabase = createClient()
      const { data: loja } = await supabase
        .from('lojas')
        .select('aceita_dinheiro, aceita_pix, aceita_cartao')
        .eq('id', items[0].loja_id)
        .single()

      if (loja) {
        setOpcoesPagamento({
          dinheiro: loja.aceita_dinheiro ?? true,
          pix: loja.aceita_pix ?? true,
          cartao: loja.aceita_cartao ?? true
        })
        // Limpa seleção se a loja não aceitar
        if (formData.formaPagamento === 'dinheiro' && !loja.aceita_dinheiro) setFormData(prev => ({ ...prev, formaPagamento: '' }))
        if (formData.formaPagamento === 'pix' && !loja.aceita_pix) setFormData(prev => ({ ...prev, formaPagamento: '' }))
        if (formData.formaPagamento === 'cartao' && !loja.aceita_cartao) setFormData(prev => ({ ...prev, formaPagamento: '' }))
      }
    }
    fetchLojaConfig()
  }, [items])

  const taxaEntrega = tenant.delivery.baseFee
  const totalComEntrega = total + taxaEntrega

  const selecionarEndereco = (end: EnderecoSalvo) => {
    setUsarEnderecoSalvo(end.id)
    setFormData(prev => ({
      ...prev,
      rua: end.rua,
      numero: end.numero,
      bairro: end.bairro,
      complemento: end.complemento || '',
      referencia: end.referencia || ''
    }))
  }

  const limparEndereco = () => {
    setUsarEnderecoSalvo(null)
    setFormData(prev => ({ ...prev, rua: '', numero: '', bairro: '', complemento: '', referencia: '' }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Se o usuário digitar, desmarca a seleção automática para indicar edição
    if (['rua', 'numero', 'bairro'].includes(name)) {
      setUsarEnderecoSalvo(null)
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.rua.trim()) newErrors.rua = 'Rua é obrigatória'
    if (!formData.numero.trim()) newErrors.numero = 'Número é obrigatório'
    if (!formData.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório'
    if (!formData.formaPagamento) newErrors.formaPagamento = 'Selecione uma forma de pagamento'
    
    if (formData.formaPagamento === 'dinheiro' && formData.trocoPara) {
      const troco = parseFloat(formData.trocoPara)
      if (troco < totalComEntrega) newErrors.trocoPara = 'Valor menor que o total'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)

    try {
      const supabase = createClient()
      const enderecoCompleto = `${formData.rua}, ${formData.numero} - ${formData.bairro}${formData.complemento ? ` (${formData.complemento})` : ''}`
      
      // 1. Salvar endereço novo se solicitado
      if (salvarNovoEndereco && !usarEnderecoSalvo && user) {
        await supabase.from('cliente_enderecos').insert({
          user_id: user.id,
          apelido: 'Novo Endereço',
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          complemento: formData.complemento,
          referencia: formData.referencia
        })
      }

      // 2. Criar Pedido
      const { data: pedido, error } = await supabase.from('pedidos').insert({
          loja_id: parseInt(items[0].loja_id),
          perfil_id: user.id, // Link com o usuário
          // Campos de backup (snapshot)
          cliente_nome: user.user_metadata?.nome_completo || 'Cliente App',
          cliente_telefone: user.user_metadata?.telefone || '',
          endereco_entrega: enderecoCompleto,
          referencia: formData.referencia,
          forma_pagamento: formData.formaPagamento,
          troco_para: formData.formaPagamento === 'dinheiro' && formData.trocoPara ? parseFloat(formData.trocoPara) : null,
          observacoes: formData.observacoes,
          taxa_entrega: taxaEntrega,
          total: totalComEntrega,
          subtotal: total,
          status: 'pendente',
          tipo_entrega: 'delivery'
      }).select().single()

      if (error) throw error

      // 3. Criar Itens
      const itensPayload = items.map(item => ({
        pedido_id: pedido.id,
        produto_id: parseInt(item.produto_id),
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        observacao: item.observacao
      }))

      await supabase.from('pedido_itens').insert(itensPayload)

      clearCart()
      router.push(`/${tenant.slug}/pedido/${pedido.id}`)

    } catch (error: any) {
      alert('Erro ao criar pedido: ' + error.message)
      setLoading(false)
    }
  }

  if (checkingAuth) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>
  if (items.length === 0) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* SELEÇÃO DE ENDEREÇO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📍 Endereço de Entrega</h2>
              
              {/* Lista de Salvos */}
              {enderecosSalvos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
                  {enderecosSalvos.map(end => (
                    <div 
                      key={end.id}
                      onClick={() => selecionarEndereco(end)}
                      className={`cursor-pointer min-w-[200px] p-4 rounded-lg border-2 transition-all ${
                        usarEnderecoSalvo === end.id 
                          ? 'border-tenant-primary bg-tenant-primary/10' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-900'
                      }`}
                    >
                      <div className="font-bold text-white mb-1">{end.apelido || 'Endereço'}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{end.rua}, {end.numero}</div>
                      <div className="text-xs text-gray-500">{end.bairro}</div>
                    </div>
                  ))}
                  <div 
                    onClick={limparEndereco}
                    className={`cursor-pointer min-w-[140px] p-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-white transition-all ${!usarEnderecoSalvo ? 'bg-gray-700' : ''}`}
                  >
                    + Outro
                  </div>
                </div>
              )}

              {/* Formulário */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="text-gray-400 text-xs mb-1 block">Rua / Avenida *</label>
                  <input name="rua" value={formData.rua} onChange={handleChange} className={`w-full bg-gray-900 border ${errors.rua ? 'border-red-500' : 'border-gray-600'} rounded p-3 text-white outline-none focus:border-tenant-primary`} />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Número *</label>
                  <input name="numero" value={formData.numero} onChange={handleChange} className={`w-full bg-gray-900 border ${errors.numero ? 'border-red-500' : 'border-gray-600'} rounded p-3 text-white outline-none focus:border-tenant-primary`} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Bairro *</label>
                  <input name="bairro" value={formData.bairro} onChange={handleChange} className={`w-full bg-gray-900 border ${errors.bairro ? 'border-red-500' : 'border-gray-600'} rounded p-3 text-white outline-none focus:border-tenant-primary`} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Complemento</label>
                  <input name="complemento" value={formData.complemento} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" />
                </div>
                <div className="md:col-span-4">
                  <label className="text-gray-400 text-xs mb-1 block">Ponto de Referência</label>
                  <input name="referencia" value={formData.referencia} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" />
                </div>
              </div>

              {/* Checkbox Salvar */}
              {!usarEnderecoSalvo && (
                <div className="mt-4 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="salvarEnd" 
                    checked={salvarNovoEndereco} 
                    onChange={e => setSalvarNovoEndereco(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-tenant-primary focus:ring-0" 
                  />
                  <label htmlFor="salvarEnd" className="text-sm text-gray-300 cursor-pointer">Salvar este endereço para a próxima vez</label>
                </div>
              )}
            </div>

            {/* PAGAMENTO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">💳 Pagamento</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {opcoesPagamento.dinheiro && (
                  <button onClick={() => setFormData({ ...formData, formaPagamento: 'dinheiro' })} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'dinheiro' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}>
                    <span className="text-2xl">💵</span><span className="text-sm font-bold">Dinheiro</span>
                  </button>
                )}
                {opcoesPagamento.pix && (
                  <button onClick={() => setFormData({ ...formData, formaPagamento: 'pix' })} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'pix' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}>
                    <span className="text-2xl">💠</span><span className="text-sm font-bold">Pix</span>
                  </button>
                )}
                {opcoesPagamento.cartao && (
                  <button onClick={() => setFormData({ ...formData, formaPagamento: 'cartao' })} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'cartao' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}>
                    <span className="text-2xl">💳</span><span className="text-sm font-bold">Cartão</span>
                  </button>
                )}
              </div>
              
              {formData.formaPagamento === 'dinheiro' && (
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Troco para quanto?</label>
                  <input type="number" name="trocoPara" value={formData.trocoPara} onChange={handleChange} placeholder={`Mínimo: R$ ${totalComEntrega.toFixed(2)}`} className={`w-full bg-gray-900 border ${errors.trocoPara ? 'border-red-500' : 'border-gray-600'} rounded p-3 text-white outline-none focus:border-tenant-primary`} />
                </div>
              )}
              {errors.formaPagamento && <p className="text-red-500 text-sm mt-2">{errors.formaPagamento}</p>}
            </div>

            {/* OBSERVAÇÃO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">📝 Observações</h2>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Ex: A campainha não funciona, ligar quando chegar..." className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary h-24 resize-none" />
            </div>

          </div>

          {/* RESUMO LATERAL */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{item.quantidade}x {item.nome}</span>
                    <span className="text-white">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Taxa Entrega</span><span>R$ {taxaEntrega.toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700"><span>Total</span><span className="text-tenant-primary">R$ {totalComEntrega.toFixed(2)}</span></div>
              </div>
              
              <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 py-4 bg-tenant-primary text-tenant-secondary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
                {loading ? 'Enviando...' : 'CONFIRMAR PEDIDO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}