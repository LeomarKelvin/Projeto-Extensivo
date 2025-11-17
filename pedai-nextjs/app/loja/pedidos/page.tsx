import { Metadata } from 'next'
import LojaPedidosContent from '@/components/loja/LojaPedidosContent'

export const metadata: Metadata = {
  title: 'Pedidos - Dashboard Loja - PedeAí',
  description: 'Gerencie os pedidos da sua loja',
}

export default function PedidosPage() {
  return <LojaPedidosContent />
}
