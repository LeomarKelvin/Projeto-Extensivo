import Link from 'next/link'
import { getAllTenants } from '@/lib/tenantConfig'

export default function Home() {
  const allTenants = getAllTenants()
  
  // Reorder to put Alagoa Nova in the center
  const orderedTenants = [
    allTenants.find(t => t.slug === 'esperanca'),
    allTenants.find(t => t.slug === 'alagoa-nova'),
    allTenants.find(t => t.slug === 'lagoa-seca'),
  ].filter((t): t is NonNullable<typeof t> => t !== undefined)
  
  return (
    <div className="min-h-screen bg-secondary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex items-center mb-8">
            <svg className="h-24 w-24 lightning-logo" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="#FFD100"></circle>
              <circle cx="12" cy="12" r="9" fill="#1A1A1A"></circle>
              <path d="M13 6L7 14h4v4l6-8h-4V6z" fill="#FFD100"></path>
            </svg>
          </div>
          <h1 className="text-6xl font-bold mb-4">
            Pede<span className="text-primary">Aí</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-12">
            Delivery local para sua cidade
          </p>

          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-center mb-6">
              Escolha seu município:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {orderedTenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/${tenant.slug}`}
                  className="p-6 rounded-lg border-2 text-center hover:scale-105 transition-transform"
                  style={{ borderColor: tenant.theme.primary }}
                >
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: tenant.theme.primary }}
                  >
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-gray-400">{tenant.state}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
