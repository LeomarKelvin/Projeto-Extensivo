import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaCadastroEntregadores from '@/components/loja/LojaCadastroEntregadores'

export const metadata: Metadata = {
  title: 'Gestão de Entregadores - PedeAí',
  description: 'Gerencie sua equipe de entrega',
}

export default function EntregadoresPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaCadastroEntregadores />
    </ClientLayout>
  )
}