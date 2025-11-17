import { getAllTenants } from '@/lib/tenantConfig'
import Link from 'next/link'
import ClientLayout from '@/components/ClientLayout'

export default function TenantsPage() {
  const tenants = getAllTenants()

  return (
    <ClientLayout showFooter={false}>
      <div className="min-h-screen bg-secondary text-white p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            Escolha seu Município
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white/5 rounded-lg p-6 border-2 hover:scale-105 transition-transform"
                style={{ borderColor: tenant.theme.primary }}
              >
                <h2
                  className="text-2xl font-bold mb-6 text-center"
                  style={{ color: tenant.theme.primary }}
                >
                  {tenant.name}
                </h2>

                <Link
                  href={`/${tenant.slug}`}
                  className="block text-center py-3 px-6 rounded-lg font-semibold transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: tenant.theme.primary,
                    color: tenant.theme.secondary,
                  }}
                >
                  Visitar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
