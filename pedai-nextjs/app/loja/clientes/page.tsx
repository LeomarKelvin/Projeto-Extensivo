import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaClientesContent from '@/components/loja/LojaClientesContent'

export const metadata: Metadata = {
  title: 'Meus Clientes - PedeAí',
  description: 'Gerencie sua base de clientes',
}

export default function ClientesPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaClientesContent />
    </ClientLayout>
  )
}