import AdminLayout from '@/components/admin/AdminLayout'
import AdminFinanceiro from '@/components/admin/financeiro/AdminFinanceiro'

export default function FinanceiroPage() {
  return (
    <AdminLayout currentPage="financeiro">
      <AdminFinanceiro />
    </AdminLayout>
  )
}
