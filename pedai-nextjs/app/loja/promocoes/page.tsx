import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaPromocoesContent from '@/components/loja/LojaPromocoesContent'

export const metadata: Metadata = {
  title: 'Promoções - PedeAí',
  description: 'Gerencie seus cupons de desconto',
}

export default function PromocoesPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaPromocoesContent />
    </ClientLayout>
  )
}