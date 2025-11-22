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
  id: number
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
  
  // Endereços
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([])
  const [usarEnderecoSalvo, setUsarEnderecoSalvo] = useState<number | null>(null)
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(false)

  // Cupons
  const [cupomCodigo, setCupomCodigo] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null)
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Cupom[]>([])
  const [showCuponsList, setShowCuponsList] = useState(false)

  // Pagamento e Taxas (CORREÇÃO AQUI: Estados para as taxas)
  const [opcoesPagamento, setOpcoesPagamento] = useState({ dinheiro: true, pix: true, cartao: true })
  const [taxaLojaPadrao, setTaxaLojaPadrao] = useState(tenant.delivery.baseFee) // Começa com fallback
  const [taxaBairroEspecifica, setTaxaBairroEspecifica] = useState<number | null>(null)

  // Form
  const [formData, setFormData] = useState({
    rua: '', numero: '', bairro: '', complemento: '', referencia: '', formaPagamento: '', trocoPara: '', observacoes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Toast
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

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

  // 3. Buscar Endereços
  useEffect(() => {
    const fetchEnderecos = async () => {
      if (!user) return
      const supabase = createClient()
      
      const { data: ends } = await supabase
        .from('cliente_enderecos')
        .select('*')
        .eq('user_id', user.id)
        .order('principal', { ascending: false })
      
      if (ends && ends.length > 0) {
        setEnderecosSalvos(ends)
        if (ends.length > 0 && !formData.rua) selecionarEndereco(ends[0])
      }
    }

    if (!authLoading && user) {
      fetchEnderecos()
    } else if (!authLoading && !user) {
      router.push(`/${tenant.slug}/auth/login`)
    }
  }, [user, authLoading])

  // 4. Buscar Config da Loja (Taxa Padrão e Pagamentos)
  useEffect(() => {
    const fetchLojaData = async () => {
      if (items.length === 0) return
      const supabase = createClient()
      const lojaId = items[0].loja_id

      // CORREÇÃO: Busca a taxa_entrega da tabela lojas
      const { data: loja } = await supabase
        .from('lojas')
        .select('aceita_dinheiro, aceita_pix, aceita_cartao, taxa_entrega')
        .eq('id', lojaId)
        .single()

      if (loja) {
        setOpcoesPagamento({ 
          dinheiro: loja.aceita_dinheiro ?? true, 
          pix: loja.aceita_pix ?? true, 
          cartao: loja.aceita_cartao ?? true 
        })
        // Atualiza a taxa padrão com o valor do banco
        if (loja.taxa_entrega !== undefined && loja.taxa_entrega !== null) {
          setTaxaLojaPadrao(loja.taxa_entrega)
        }
      }

      // Cupons
      const { data: coupons } = await supabase.from('cupons').select('*').eq('loja_id', lojaId).eq('ativo', true)
      if (coupons) setCuponsDisponiveis(coupons)
    }
    
    fetchLojaData()
  }, [items])

  // 5. Buscar Taxa do Bairro (Dinâmico)
  useEffect(() => {
    const verificarTaxaBairro = async () => {
      if (items.length === 0 || !formData.bairro) {
        setTaxaBairroEspecifica(null)
        return
      }
      
      const supabase = createClient()
      const lojaId = items[0].loja_id

      // Busca taxa específica na tabela loja_bairros
      const { data } = await supabase
        .from('loja_bairros')
        .select('taxa_entrega')
        .eq('loja_id', lojaId)
        .ilike('nome_bairro', formData.bairro.trim())
        .maybeSingle()
      
      if (data) {
        setTaxaBairroEspecifica(data.taxa_entrega)
      } else {
        setTaxaBairroEspecifica(null)
      }
    }

    // Delay para não chamar o banco a cada tecla
    const delay = setTimeout(verificarTaxaBairro, 500)
    return () => clearTimeout(delay)
  }, [formData.bairro, items])


  // === CÁLCULO FINAL DO FRETE ===
  // Prioridade: Bairro Específico > Taxa Padrão da Loja
  const taxaEntregaBase = taxaBairroEspecifica !== null ? taxaBairroEspecifica : taxaLojaPadrao
  
  let taxaEntregaFinal = taxaEntregaBase
  let valorDesconto = 0

  if (cupomAplicado) {
    if (cupomAplicado.tipo === 'frete_gratis') taxaEntregaFinal = 0
    else if (cupomAplicado.tipo === 'valor_fixo') valorDesconto = cupomAplicado.valor
    else if (cupomAplicado.tipo === 'percentual') valorDesconto = (total * cupomAplicado.valor) / 100
  }
  
  const totalFinal = Math.max(0, total + taxaEntregaFinal - valorDesconto)

  // Funções
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (['rua', 'numero', 'bairro'].includes(e.target.name)) setUsarEnderecoSalvo(null)
  }

  const aplicarCupom = () => {
    const cupom = cuponsDisponiveis.find(c => c.codigo === cupomCodigo.toUpperCase())
    if (!cupom) return notify('Cupom inválido.', 'error')
    if (cupom.valor_minimo_pedido && total < cupom.valor_minimo_pedido) return notify(`Mínimo: R$ ${cupom.valor_minimo_pedido}`, 'error')
    
    setCupomAplicado(cupom)
    setShowCuponsList(false)
    notify('Cupom aplicado!', 'success')
  }

  const selecionarCupomDaLista = (cupom: Cupom) => {
    setCupomCodigo(cupom.codigo)
    if (cupom.valor_minimo_pedido && total < cupom.valor_minimo_pedido) {
       notify(`Falta R$ ${(cupom.valor_minimo_pedido - total).toFixed(2)} para usar este cupom`, 'error')
    } else {
       setCupomAplicado(cupom)
       setShowCuponsList(false)
       notify('Cupom aplicado!', 'success')
    }
  }

  const removerCupom = () => {
    setCupomAplicado(null)
    setCupomCodigo('')
    notify('Cupom removido.', 'success')
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
      if (cupomAplicado) await supabase.rpc('incrementar_uso_cupom', { cupom_id: cupomAplicado.id })

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
            
            {/* ENDEREÇOS */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📍 Endereço de Entrega</h2>
              
              {enderecosSalvos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                  {enderecosSalvos.map(end => (
                    <div 
                      key={end.id} 
                      onClick={() => selecionarEndereco(end)} 
                      className={`cursor-pointer min-w-[200px] p-4 rounded-lg border-2 transition-all relative ${usarEnderecoSalvo === end.id ? 'border-tenant-primary bg-tenant-primary/10 shadow-lg' : 'border-gray-600 hover:border-gray-500 bg-gray-900'}`}
                    >
                      <div className="font-bold text-white mb-1">{end.apelido || 'Endereço'}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{end.rua}, {end.numero}</div>
                      <div className="text-xs text-gray-500">{end.bairro}</div>
                      {usarEnderecoSalvo === end.id && <div className="absolute top-2 right-2 text-tenant-primary text-xs">●</div>}
                    </div>
                  ))}
                  <div onClick={limparEndereco} className={`cursor-pointer min-w-[140px] p-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all ${!usarEnderecoSalvo ? 'bg-gray-700' : ''}`}>
                    <span className="text-2xl">+</span>
                    <span className="text-xs">Outro</span>
                  </div>
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
                {cuponsDisponiveis.length > 0 && <button onClick={() => setShowCuponsList(!showCuponsList)} className="text-sm text-tenant-primary hover:underline font-medium">Ver disponíveis ({cuponsDisponiveis.length})</button>}
              </div>
              {!cupomAplicado ? (
                <div className="flex gap-2">
                  <input placeholder="Código do cupom" value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value.toUpperCase())} className="flex-1 bg-gray-900 border border-gray-600 rounded p-3 text-white outline-none uppercase" />
                  <button onClick={aplicarCupom} className="bg-tenant-primary text-tenant-secondary px-6 rounded font-bold hover:opacity-90 transition-all">Aplicar</button>
                </div>
              ) : (
                <div className="bg-green-500/20 border border-green-500 p-3 rounded flex justify-between items-center">
                  <div className="text-green-400 font-bold flex items-center gap-2"><span>✅ Cupom {cupomAplicado.codigo} aplicado!</span></div>
                  <button onClick={removerCupom} className="text-red-400 text-sm hover:text-white underline">Remover</button>
                </div>
              )}
              {showCuponsList && !cupomAplicado && (
                <div className="mt-4 space-y-2 border-t border-gray-700 pt-4 animate-fade-in-down max-h-40 overflow-y-auto custom-scrollbar">
                  {cuponsDisponiveis.map(c => (
                    <div key={c.id} onClick={() => selecionarCupomDaLista(c)} className="bg-gray-900 p-3 rounded border border-gray-700 hover:border-tenant-primary cursor-pointer flex justify-between items-center group transition-all">
                      <div>
                        <span className="text-white font-bold block group-hover:text-tenant-primary">{c.codigo}</span>
                        <span className="text-gray-400 text-xs">{c.tipo === 'frete_gratis' ? 'Frete Grátis' : c.tipo === 'percentual' ? `${c.valor}% de Desconto` : `R$ ${c.valor} OFF`}</span>
                      </div>
                      {c.valor_minimo_pedido > 0 && <span className="text-xs text-gray-500">Mínimo R$ {c.valor_minimo_pedido}</span>}
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

          {/* RESUMO LATERAL */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {items.map(item => <div key={item.id} className="flex justify-between text-sm"><span className="text-gray-400">{item.quantidade}x {item.nome}</span><span className="text-white">R$ {(item.preco * item.quantidade).toFixed(2)}</span></div>)}
              </div>
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                
                <div className="flex justify-between text-gray-400">
                  <span>Taxa Entrega</span>
                  {taxaBairroEspecifica !== null ? (
                    <span className="text-white font-medium flex items-center gap-1">
                      <span className="text-[10px] bg-blue-600 px-1 rounded">Bairro</span> R$ {taxaEntregaFinal.toFixed(2)}
                    </span>
                  ) : (
                    <span>R$ {taxaEntregaFinal.toFixed(2)}</span>
                  )}
                </div>

                {valorDesconto > 0 && <div className="flex justify-between text-green-400 font-medium"><span>Desconto</span><span>- R$ {valorDesconto.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700"><span>Total</span><span className="text-tenant-primary">R$ {totalFinal.toFixed(2)}</span></div>
              </div>
              
              <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 py-4 bg-tenant-primary text-tenant-secondary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg transform hover:scale-[1.02]">{loading ? 'Enviando...' : 'CONFIRMAR PEDIDO'}</button>
              <button onClick={() => router.push(lojaLink)} className="w-full mt-3 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">Adicionar mais itens</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {showToast && (
        <div className={`fixed top-24 right-4 md:right-8 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 border transition-all duration-500 transform translate-y-0 opacity-100 animate-fade-in-down ${toastType === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-green-600 border-green-400 text-white'}`}>
          <div className={`rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm ${toastType === 'error' ? 'bg-white text-red-600' : 'bg-white text-green-600'}`}>{toastType === 'error' ? '!' : '✓'}</div>
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}