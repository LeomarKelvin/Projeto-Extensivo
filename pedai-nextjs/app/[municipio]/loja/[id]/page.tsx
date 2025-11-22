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

async function getLojaDetalhes(identificador: string, municipio: string) {
  const supabase = await createClient()
  
  // LÓGICA HÍBRIDA: Tenta achar por ID (se for número) OU por Slug
  let query = supabase
    .from('lojas')
    .select('*')
    .eq('municipio', municipio)
    .eq('aprovada', true) // Garante aprovada

  // Verifica se é um ID numérico válido (apenas dígitos)
  const isNumericId = /^\d+$/.test(identificador);

  if (isNumericId) {
     // Se for número, tenta buscar pelo ID
     // Mas atenção: pode ser que o slug seja "123pizza", então o ideal é um OR
     // Porém, o Supabase não suporta OR fácil nessa sintaxe encadeada.
     // Vamos fazer duas tentativas para ser infalível.
     
     // Tentativa 1: Buscar por ID
     const { data: lojaById } = await supabase
       .from('lojas')
       .select('*')
       .eq('id', identificador)
       .single()
     
     if (lojaById) return processarLoja(lojaById, supabase)
  }

  // Tentativa 2: Buscar por Slug (texto)
  const { data: lojaBySlug } = await supabase
    .from('lojas')
    .select('*')
    .eq('slug_catalogo', identificador)
    .eq('municipio', municipio)
    .single()
  
  if (lojaBySlug) return processarLoja(lojaBySlug, supabase)

  return null
}

// Função auxiliar para processar e buscar produtos
async function processarLoja(loja: any, supabase: any) {
  // Calcula Status
  const estaAberta = verificarLojaAberta(
    loja.tipo_horario,
    loja.horarios_funcionamento,
    loja.aberta
  )
  const lojaAtualizada = { ...loja, aberta: estaAberta }
  
  // Busca Produtos
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', loja.id)
    .eq('disponivel', true)
    .order('nome')
  
  return {
    loja: lojaAtualizada,
    produtos: produtos || []
  }
}

export default async function LojaPage({ params }: PageProps) {
  const { municipio, id } = await params

  if (!isTenantValid(municipio)) notFound()

  const tenant = getTenantBySlug(municipio)!
  // O 'id' aqui na verdade é o parametro da URL, que pode ser o slug
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