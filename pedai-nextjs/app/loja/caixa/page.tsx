import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaCaixaContent from '@/components/loja/LojaCaixaContent'

export const metadata: Metadata = {
  title: 'Frente de Caixa - PedeAí',
  description: 'Controle de abertura e fechamento de caixa',
}

export default function CaixaPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaCaixaContent />
    </ClientLayout>
  )
}