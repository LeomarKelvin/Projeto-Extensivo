import { getTenantBySlug, isTenantValid } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import HeroSection from '@/components/clientes/HeroSection'
import CategoriesSection from '@/components/clientes/CategoriesSection'

interface Props {
  params: Promise<{ municipio: string }>
}

export default async function MunicipioPage({ params }: Props) {
  const { municipio } = await params
  
  if (!isTenantValid(municipio)) {
    notFound()
  }

  const config = getTenantBySlug(municipio)
  
  if (!config) {
    notFound()
  }

  return (
    <ClientLayout tenant={config}>
      <HeroSection tenant={config} />
      <CategoriesSection tenant={config} />
      
      {/* Info Section */}
      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div 
              className="p-8 rounded-2xl shadow-xl"
              style={{ 
                border: `2px solid ${config.theme.primary}`,
                backgroundColor: 'rgba(26, 26, 26, 0.5)',
              }}
            >
              <h2 className="text-2xl font-bold mb-4 text-tenant-primary">
                📦 Informações de Entrega
              </h2>
              <ul className="text-left text-gray-300 space-y-3">
                <li>✓ Taxa de entrega: R$ {config.delivery.baseFee.toFixed(2)} + R$ {config.delivery.feePerKm.toFixed(2)}/km</li>
                <li>✓ Pedido mínimo: R$ {config.delivery.minOrder.toFixed(2)}</li>
                <li>✓ Entregamos em até {config.delivery.maxDistance} km</li>
              </ul>
            </div>

            <div 
              className="p-8 rounded-2xl shadow-xl"
              style={{ 
                border: `2px solid ${config.theme.primary}`,
                backgroundColor: 'rgba(26, 26, 26, 0.5)',
              }}
            >
              <h2 className="text-2xl font-bold mb-4 text-tenant-primary">
                📞 Entre em Contato
              </h2>
              <ul className="text-left text-gray-300 space-y-3">
                <li>📱 {config.contact.phone}</li>
                <li>📧 {config.contact.email}</li>
                <li>
                  <a 
                    href={`https://wa.me/${config.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity bg-tenant-primary text-tenant-secondary inline-block"
                  >
                    💬 WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
