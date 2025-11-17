import AdminLojaPedidos from '@/components/admin/loja/AdminLojaPedidos'

export default function AdminLojaPedidosPage({ params }: { params: { lojaId: string } }) {
  return <AdminLojaPedidos lojaId={params.lojaId} />
}
