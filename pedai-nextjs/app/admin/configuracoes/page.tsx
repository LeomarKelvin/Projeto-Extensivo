import AdminLayout from '@/components/admin/AdminLayout'
import AdminConfiguracoes from '@/components/admin/configuracoes/AdminConfiguracoes'

export default function ConfiguracoesPage() {
  return (
    <AdminLayout currentPage="configuracoes">
      <AdminConfiguracoes />
    </AdminLayout>
  )
}
