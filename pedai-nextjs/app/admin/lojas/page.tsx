import AdminLayout from '@/components/admin/AdminLayout'
import AdminLojas from '@/components/admin/lojas/AdminLojas'

export default function LojasPage() {
  return (
    <AdminLayout currentPage="lojas">
      <AdminLojas />
    </AdminLayout>
  )
}
