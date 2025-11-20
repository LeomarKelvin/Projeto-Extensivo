import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaFinanceiroContent from '@/components/loja/LojaFinanceiroContent'

export const metadata: Metadata = {
  title: 'Financeiro - PedeAí',
  description: 'Acompanhe seus ganhos e repasses',
}

export default function FinanceiroPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaFinanceiroContent />
    </ClientLayout>
  )
}