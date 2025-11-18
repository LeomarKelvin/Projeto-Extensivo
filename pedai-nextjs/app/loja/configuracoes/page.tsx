import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaConfiguracoesContent from '@/components/loja/LojaConfiguracoesContent'

export const metadata: Metadata = {
  title: 'Configurações da Loja - PedeAí',
  description: 'Gerencie o status e taxas da sua loja',
}

export default function LojaConfiguracoesPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaConfiguracoesContent />
    </ClientLayout>
  )
}