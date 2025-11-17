import AdminLojaDashboard from '@/components/admin/loja/AdminLojaDashboard'

export default function AdminLojaDashboardPage({ params }: { params: { lojaId: string } }) {
  return <AdminLojaDashboard lojaId={params.lojaId} />
}
