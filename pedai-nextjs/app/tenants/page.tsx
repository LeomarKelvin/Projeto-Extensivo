import { getAllTenants } from '@/lib/tenantConfig'

export default function TenantsPage() {
  const tenants = getAllTenants()

  return (
    <div className="min-h-screen bg-secondary text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Sistema Multi-Tenancy do PedeAí
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Configurações dos 3 municípios atendidos
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white/10 rounded-lg p-6 border-2 hover:scale-105 transition-transform"
              style={{ borderColor: tenant.theme.primary }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: tenant.theme.primary }}
              >
                {tenant.name} - {tenant.state}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">🎨 Tema</h3>
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: tenant.theme.primary }}
                      title="Primária"
                    />
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: tenant.theme.secondary }}
                      title="Secundária"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">🚚 Entrega</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Taxa base: R$ {tenant.delivery.baseFee.toFixed(2)}</li>
                    <li>Por km: R$ {tenant.delivery.feePerKm.toFixed(2)}</li>
                    <li>Pedido mínimo: R$ {tenant.delivery.minOrder.toFixed(2)}</li>
                    <li>Distância máx: {tenant.delivery.maxDistance} km</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">📍 Localização</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Lat: {tenant.location.lat.toFixed(4)}</li>
                    <li>Lng: {tenant.location.lng.toFixed(4)}</li>
                    <li>Raio: {tenant.location.coverageRadius} km</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">📞 Contato</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>{tenant.contact.phone}</li>
                    <li className="truncate">{tenant.contact.email}</li>
                  </ul>
                </div>

                <a
                  href={`/${tenant.slug}`}
                  className="block mt-4 text-center py-2 px-4 rounded font-semibold transition-colors"
                  style={{
                    backgroundColor: tenant.theme.primary,
                    color: tenant.theme.secondary,
                  }}
                >
                  Visitar {tenant.name}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
