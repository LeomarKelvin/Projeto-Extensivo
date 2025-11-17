import { getTenantConfig, isTenantValid } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ municipio: string }>
}

export default async function MunicipioPage({ params }: Props) {
  const { municipio } = await params
  
  if (!isTenantValid(municipio)) {
    notFound()
  }

  const config = getTenantConfig(municipio)

  return (
    <div 
      className="min-h-screen text-white"
      style={{ backgroundColor: config.theme.secondary }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex items-center mb-8">
            <svg className="h-24 w-24 lightning-logo" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill={config.theme.primary}></circle>
              <circle cx="12" cy="12" r="9" fill={config.theme.secondary}></circle>
              <path d="M13 6L7 14h4v4l6-8h-4V6z" fill={config.theme.primary}></path>
            </svg>
          </div>
          <h1 className="text-6xl font-bold mb-4">
            Pede<span style={{ color: config.theme.primary }}>Aí</span>
          </h1>
          <p className="text-3xl mb-2" style={{ color: config.theme.primary }}>
            {config.name}
          </p>
          <p className="text-xl text-gray-300 mb-12">
            Delivery local para sua cidade
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <div 
              className="p-6 rounded-lg border-2"
              style={{ borderColor: config.theme.primary }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: config.theme.primary }}>
                🚚 Informações de Entrega
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Taxa de entrega: R$ {config.delivery.baseFee.toFixed(2)} + R$ {config.delivery.feePerKm.toFixed(2)}/km</li>
                <li>✓ Pedido mínimo: R$ {config.delivery.minOrder.toFixed(2)}</li>
                <li>✓ Entregamos em até {config.delivery.maxDistance} km</li>
              </ul>
            </div>

            <div 
              className="p-6 rounded-lg border-2"
              style={{ borderColor: config.theme.primary }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: config.theme.primary }}>
                📞 Entre em Contato
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>📱 {config.contact.phone}</li>
                <li>📧 {config.contact.email}</li>
                <li>
                  <a 
                    href={`https://wa.me/${config.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 rounded font-semibold transition-colors"
                    style={{
                      backgroundColor: config.theme.primary,
                      color: config.theme.secondary,
                    }}
                  >
                    💬 WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a 
              href="/tenants"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Voltar para lista de municípios
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
