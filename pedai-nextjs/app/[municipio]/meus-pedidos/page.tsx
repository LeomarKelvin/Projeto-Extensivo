import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import ClientLayout from '@/components/ClientLayout'
import MeusPedidosContent from '@/components/clientes/MeusPedidosContent'

interface Props {
  params: Promise<{ municipio: string }>
}

export default async function MeusPedidosPage({ params }: Props) {
  const { municipio } = await params
  
  const tenant = getTenantBySlug(municipio)
  
  if (!tenant) {
    notFound()
  }

  const supabase = await createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect(`/${municipio}/auth/login?redirect=/${municipio}/meus-pedidos`)
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (!perfil || perfil.tipo !== 'cliente') {
    redirect(`/${municipio}`)
  }

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      lojas:loja_id (
        id,
        nome_loja
      ),
      pedido_itens (
        id,
        produto_id,
        nome_produto,
        quantidade,
        preco_unitario,
        subtotal
      )
    `)
    .eq('perfil_id', perfil.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar pedidos:', error)
  }

  return (
    <ClientLayout tenant={tenant}>
      <MeusPedidosContent 
        pedidos={pedidos || []} 
        tenant={tenant}
        perfil={perfil}
      />
    </ClientLayout>
  )
}
