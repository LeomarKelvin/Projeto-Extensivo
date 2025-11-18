import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaProdutosContent from '@/components/loja/LojaProdutosContent'

export const metadata: Metadata = {
  title: 'Gerenciar Produtos - PedeAí',
  description: 'Adicione e edite seus produtos',
}

export default function LojaProdutosPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaProdutosContent />
    </ClientLayout>
  )
}