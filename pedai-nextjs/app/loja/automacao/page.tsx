import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaAutomacaoContent from '@/components/loja/LojaAutomacaoContent'

export const metadata: Metadata = {
  title: 'Automação & Robô - PedeAí',
  description: 'Configure as mensagens automáticas e sons',
}

export default function AutomacaoPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaAutomacaoContent />
    </ClientLayout>
  )
}