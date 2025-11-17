import { Metadata } from 'next'
import ClientLayout from '@/components/ClientLayout'
import LojaDashboard from '@/components/loja/LojaDashboard'

export const metadata: Metadata = {
  title: 'Dashboard - Loja - PedeAí',
  description: 'Gerencie sua loja no PedeAí',
}

export default function DashboardPage() {
  return (
    <ClientLayout showCart={false}>
      <LojaDashboard />
    </ClientLayout>
  )
}
