import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'
import ClientLayout from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'Login - PedeAí',
  description: 'Faça login na sua conta PedeAí',
}

export default function LoginPage() {
  return (
    <ClientLayout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo!</h1>
            <p className="text-gray-400">Entre na sua conta ou crie uma nova</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </ClientLayout>
  )
}
