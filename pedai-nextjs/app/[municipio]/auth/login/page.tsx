import { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenantConfig'
import { notFound } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import ClientLayout from '@/components/ClientLayout'

interface PageProps {
  params: {
    municipio: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = getTenantBySlug(params.municipio)
  
  if (!tenant) {
    return {
      title: 'Município não encontrado',
    }
  }

  return {
    title: `Login - ${tenant.name} - PedeAí`,
    description: 'Faça login na sua conta PedeAí',
  }
}

export default function LoginPage({ params }: PageProps) {
  const tenant = getTenantBySlug(params.municipio)

  if (!tenant) {
    notFound()
  }

  return (
    <ClientLayout tenant={tenant}>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo a <span className="text-tenant-primary">{tenant.name}</span>!</h1>
            <p className="text-gray-400">Entre na sua conta ou crie uma nova</p>
          </div>
          
          <LoginForm tenant={tenant} />
        </div>
      </div>
    </ClientLayout>
  )
}
