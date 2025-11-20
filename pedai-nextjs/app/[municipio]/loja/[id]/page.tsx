import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import ClientLayout from '@/components/ClientLayout'
import LojaDetalhesContent from '@/components/clientes/LojaDetalhesContent'
import { getTenantBySlug, isTenantValid } from '@/lib/tenantConfig'
import { createClient } from '@/lib/supabase/server'
import { verificarLojaAberta } from '@/lib/utils/shopStatus'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ municipio: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { municipio } = await params
  const tenant = getTenantBySlug(municipio)
  if (!tenant) return { title: 'Município não encontrado' }
  return { title: `Loja - ${tenant.name} | PedeAí` }
}

async function getLojaDetalhes(lojaId: string, municipio: string) {
  const supabase = await createClient()
  
  // REMOVI O FILTRO .eq('aprovada', true)
  const { data: loja, error: lojaError } = await supabase
    .from('lojas')
    .select('*')
    .eq('id', lojaId)
    .eq('municipio', municipio)
    .single()
  
  if (lojaError || !loja) return null

  // Verifica Horário
  const estaAberta = verificarLojaAberta(
    loja.tipo_horario,
    loja.horarios_funcionamento,
    loja.aberta
  )
  const lojaAtualizada = { ...loja, aberta: estaAberta }
  
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', lojaId)
    .eq('disponivel', true)
    .order('nome')
  
  return { loja: lojaAtualizada, produtos: produtos || [] }
}

export default async function LojaPage({ params }: PageProps) {
  const { municipio, id } = await params

  if (!isTenantValid(municipio)) notFound()

  const tenant = getTenantBySlug(municipio)!
  const data = await getLojaDetalhes(id, tenant.slug)

  if (!data) notFound()

  return (
    <ClientLayout tenant={tenant}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <main className="flex-1">
          <LojaDetalhesContent 
            tenant={tenant} 
            loja={data.loja}
            produtos={data.produtos}
          />
        </main>
        <Footer tenant={tenant} />
      </div>
    </ClientLayout>
  )
}