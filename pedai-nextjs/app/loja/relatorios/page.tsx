import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaRelatoriosContent from '@/components/loja/LojaRelatoriosContent'

export const metadata: Metadata = {
  title: 'Relatórios - PedeAí',
  description: 'Acompanhe o desempenho da sua loja',
}

export default function RelatoriosPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaRelatoriosContent />
    </ClientLayout>
  )
}