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

interface Cupom {
  codigo: string
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis'
  valor: number
  valor_minimo_pedido: number
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
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([])
  const [usarEnderecoSalvo, setUsarEnderecoSalvo] = useState<number | null>(null)
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(false)

  // CUPONS
  const [cupomCodigo, setCupomCodigo] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null)
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Cupom[]>([])
  const [showCupons, setShowCupons] = useState(false)

  // NOTIFICAÇÃO (TOAST)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const [opcoesPagamento, setOpcoesPagamento] = useState({
    dinheiro: true,
    pix: true,
    cartao: true
  })

  const [formData, setFormData] = useState({
    rua: '', numero: '', bairro: '', complemento: '', referencia: '', formaPagamento: '', trocoPara: '', observacoes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 1. Carregar Rascunho
  useEffect(() => {
    const draft = localStorage.getItem('checkout_draft')
    if (draft) {
      try { setFormData(prev => ({ ...prev, ...JSON.parse(draft) })) } catch (e) {}
    }
  }, [])

  // 2. Salvar Rascunho
  useEffect(() => {
    localStorage.setItem('checkout_draft', JSON.stringify(formData))
  }, [formData])

  // 3. Carregar Dados
  useEffect(() => {
    const init = async () => {
      if (!user || items.length === 0) return
      const supabase = createClient()
      const lojaId = items[0].loja_id

      const { data: ends } = await supabase.from('cliente_enderecos').select('*').eq('user_id', user.id).order('principal', { ascending: false })
      if (ends) {
        setEnderecosSalvos(ends)
        if (ends.length > 0 && !formData.rua) selecionarEndereco(ends[0])
      }

      const { data: loja } = await supabase.from('lojas').select('aceita_dinheiro, aceita_pix, aceita_cartao').eq('id', lojaId).single()
      if (loja) setOpcoesPagamento({ dinheiro: loja.aceita_dinheiro ?? true, pix: loja.aceita_pix ?? true, cartao: loja.aceita_cartao ?? true })

      const { data: coupons } = await supabase.from('cupons').select('*').eq('loja_id', lojaId).eq('ativo', true)
      if (coupons) setCuponsDisponiveis(coupons)
    }

    if (!authLoading) {
      if (!user) router.push(`/${tenant.slug}/auth/login`)
      else init()
    }
  }, [user, authLoading, items])

  // Cálculos Financeiros
  const taxaEntregaOriginal = tenant.delivery.baseFee
  let taxaEntregaFinal = taxaEntregaOriginal
  let descontoValor = 0

  if (cupomAplicado) {
    if (cupomAplicado.tipo === 'frete_gratis') taxaEntregaFinal = 0
    else if (cupomAplicado.tipo === 'valor_fixo') descontoValor = cupomAplicado.valor
    else if (cupomAplicado.tipo === 'percentual') descontoValor = (total * cupomAplicado.valor) / 100
  }
  
  const totalFinal = Math.max(0, total + taxaEntregaFinal - descontoValor)

  // Funções
  const selecionarEndereco = (end: EnderecoSalvo) => {
    setUsarEnderecoSalvo(end.id)
    setFormData(prev => ({ ...prev, rua: end.rua, numero: end.numero, bairro: end.bairro, complemento: end.complemento || '', referencia: end.referencia || '' }))
  }

  const limparEndereco = () => {
    setUsarEnderecoSalvo(null)
    setFormData(prev => ({ ...prev, rua: '', numero: '', bairro: '', complemento: '', referencia: '' }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (['rua', 'numero', 'bairro'].includes(e.target.name)) setUsarEnderecoSalvo(null)
  }

  const aplicarCupom = () => {
    const cupom = cuponsDisponiveis.find(c => c.codigo === cupomCodigo.toUpperCase())
    if (!cupom) return notify('Cupom inválido ou expirado.', 'error')
    if (cupom.valor_minimo_pedido && total < cupom.valor_minimo_pedido) return notify(`Valor mínimo: R$ ${cupom.valor_minimo_pedido}`, 'error')
    
    setCupomAplicado(cupom)
    setShowCupons(false)
    notify('Cupom aplicado! 🎉', 'success')
  }

  const handleSubmit = async () => {
    if (!formData.rua || !formData.numero || !formData.bairro || !formData.formaPagamento) return notify('Preencha todos os campos.', 'error')
    setLoading(true)

    try {
      const supabase = createClient()
      const enderecoCompleto = `${formData.rua}, ${formData.numero} - ${formData.bairro}${formData.complemento ? ` (${formData.complemento})` : ''}`
      
      if (salvarNovoEndereco && !usarEnderecoSalvo && user) {
        await supabase.from('cliente_enderecos').insert({ user_id: user.id, ...formData, apelido: 'Novo Endereço' })
      }

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        loja_id: parseInt(items[0].loja_id),
        perfil_id: user.id,
        cliente_nome: user.user_metadata?.nome_completo || 'Cliente App',
        cliente_telefone: user.user_metadata?.telefone || '',
        endereco_entrega: enderecoCompleto,
        referencia: formData.referencia,
        forma_pagamento: formData.formaPagamento,
        troco_para: formData.formaPagamento === 'dinheiro' && formData.trocoPara ? parseFloat(formData.trocoPara) : null,
        observacoes: formData.observacoes,
        taxa_entrega: taxaEntregaFinal,
        subtotal: total,
        total: totalFinal,
        status: 'pendente',
        tipo_entrega: 'delivery'
      }).select().single()

      if (error) throw error

      const itensPayload = items.map(item => ({ pedido_id: pedido.id, produto_id: parseInt(item.produto_id), quantidade: item.quantidade, preco_unitario: item.preco, observacao: item.observacao }))
      await supabase.from('pedido_itens').insert(itensPayload)

      clearCart()
      localStorage.removeItem('checkout_draft')
      router.push(`/${tenant.slug}/pedido/${pedido.id}`)
    } catch (e: any) { notify(e.message, 'error'); setLoading(false) }
  }

  if (authLoading || items.length === 0) return null
  const lojaLink = items.length > 0 ? `/${tenant.slug}/loja/${items[0].loja_id}` : `/${tenant.slug}/lojas`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* ENDEREÇO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📍 Endereço</h2>
              {enderecosSalvos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
                  {enderecosSalvos.map(end => (
                    <div key={end.id} onClick={() => selecionarEndereco(end)} className={`cursor-pointer min-w-[200px] p-4 rounded-lg border-2 transition-all ${usarEnderecoSalvo === end.id ? 'border-tenant-primary bg-tenant-primary/10' : 'border-gray-600 hover:border-gray-500 bg-gray-900'}`}>
                      <div className="font-bold text-white mb-1">{end.apelido || 'Endereço'}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{end.rua}, {end.numero}</div>
                      <div className="text-xs text-gray-500">{end.bairro}</div>
                    </div>
                  ))}
                  <div onClick={limparEndereco} className={`cursor-pointer min-w-[140px] p-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-white transition-all ${!usarEnderecoSalvo ? 'bg-gray-700' : ''}`}>+ Outro</div>
                </div>
              )}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-3"><label className="text-gray-400 text-xs mb-1 block">Rua *</label><input name="rua" value={formData.rua} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Número *</label><input name="numero" value={formData.numero} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>
                <div className="md:col-span-2"><label className="text-gray-400 text-xs mb-1 block">Bairro *</label><input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>
                <div className="md:col-span-2"><label className="text-gray-400 text-xs mb-1 block">Complemento</label><input name="complemento" value={formData.complemento} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>
                <div className="md:col-span-4"><label className="text-gray-400 text-xs mb-1 block">Ref.</label><input name="referencia" value={formData.referencia} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>
              </div>
              {!usarEnderecoSalvo && <div className="mt-4 flex items-center gap-2"><input type="checkbox" id="salvarEnd" checked={salvarNovoEndereco} onChange={e => setSalvarNovoEndereco(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-tenant-primary focus:ring-0" /><label htmlFor="salvarEnd" className="text-sm text-gray-300 cursor-pointer">Salvar este endereço</label></div>}
            </div>

            {/* PAGAMENTO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">💳 Pagamento</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {opcoesPagamento.dinheiro && <button onClick={() => setFormData(prev => ({ ...prev, formaPagamento: 'dinheiro' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'dinheiro' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}><span className="text-2xl">💵</span><span className="text-sm font-bold">Dinheiro</span></button>}
                {opcoesPagamento.pix && <button onClick={() => setFormData(prev => ({ ...prev, formaPagamento: 'pix' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'pix' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}><span className="text-2xl">💠</span><span className="text-sm font-bold">Pix</span></button>}
                {opcoesPagamento.cartao && <button onClick={() => setFormData(prev => ({ ...prev, formaPagamento: 'cartao' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${formData.formaPagamento === 'cartao' ? 'border-tenant-primary bg-tenant-primary/10 text-white' : 'border-gray-600 text-gray-400'}`}><span className="text-2xl">💳</span><span className="text-sm font-bold">Cartão</span></button>}
              </div>
              {formData.formaPagamento === 'dinheiro' && <div><label className="text-gray-400 text-xs mb-1 block">Troco para?</label><input type="number" name="trocoPara" value={formData.trocoPara} onChange={handleChange} placeholder={`Mínimo: R$ ${totalFinal.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary" /></div>}
            </div>

            {/* CUPONS */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">🎟️ Cupom</h2>
                <button onClick={() => setShowCupons(!showCupons)} className="text-xs text-tenant-primary hover:underline">Ver disponíveis</button>
              </div>
              <div className="flex gap-2">
                <input placeholder="Código do cupom" value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value.toUpperCase())} className="flex-1 bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none uppercase" />
                <button onClick={aplicarCupom} className="bg-tenant-primary text-tenant-secondary px-6 rounded font-bold hover:opacity-90">Aplicar</button>
              </div>
              {cupomAplicado && (
                <div className="mt-3 bg-green-500/20 text-green-400 p-2 rounded text-sm flex justify-between">
                  <span>Cupom <b>{cupomAplicado.codigo}</b> aplicado!</span>
                  <button onClick={() => setCupomAplicado(null)} className="text-red-400 hover:text-white">Remover</button>
                </div>
              )}
              {showCupons && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar border-t border-gray-700 pt-4">
                  {cuponsDisponiveis.length === 0 ? <p className="text-gray-500 text-sm">Nenhum cupom disponível.</p> : cuponsDisponiveis.map(c => (
                    <div key={c.codigo} onClick={() => setCupomCodigo(c.codigo)} className="flex justify-between items-center bg-gray-900 p-2 rounded cursor-pointer hover:bg-gray-700">
                      <span className="font-bold text-white">{c.codigo}</span>
                      <span className="text-xs text-gray-400">{c.tipo === 'percentual' ? `${c.valor}% OFF` : `R$ ${c.valor} OFF`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OBSERVAÇÃO */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">📝 Observações</h2>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none focus:border-tenant-primary h-24 resize-none" />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {items.map(item => <div key={item.id} className="flex justify-between text-sm"><span className="text-gray-400">{item.quantidade}x {item.nome}</span><span className="text-white">R$ {(item.preco * item.quantidade).toFixed(2)}</span></div>)}
              </div>
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Taxa Entrega</span><span>R$ {taxaEntregaFinal.toFixed(2)}</span></div>
                {descontoValor > 0 && <div className="flex justify-between text-green-400"><span>Desconto</span><span>- R$ {descontoValor.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700"><span>Total</span><span className="text-tenant-primary">R$ {totalFinal.toFixed(2)}</span></div>
              </div>
              
              <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 py-4 bg-tenant-primary text-tenant-secondary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{loading ? 'Enviando...' : 'CONFIRMAR PEDIDO'}</button>
              <button onClick={() => router.push(lojaLink)} className="w-full mt-3 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">Adicionar mais itens</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NO TOPO DIREITO */}
      {showToast && (
        <div className={`fixed top-24 right-4 md:right-8 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 border transition-all duration-500 transform translate-y-0 opacity-100 ${
          toastType === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-green-600 border-green-400 text-white'
        }`}>
          <div className={`rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm ${
            toastType === 'error' ? 'bg-white text-red-600' : 'bg-white text-green-600'
          }`}>{toastType === 'error' ? '!' : '✓'}</div>
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}