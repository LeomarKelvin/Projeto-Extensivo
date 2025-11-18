'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TenantConfig } from '@/lib/types/tenant'

interface LoginFormProps {
  tenant?: TenantConfig
}

export default function LoginForm({ tenant }: LoginFormProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })
  
  // Register state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    nome: '',
    tipo: 'cliente' as 'cliente' | 'loja' | 'entregador',
    nome_loja: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Authenticate user (establishes session in browser)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao fazer login')
      }

      // Get user profile via API (bypasses RLS)
      // Send access token in Authorization header for localStorage-based auth
      const session = (await supabase.auth.getSession()).data.session
      const response = await fetch('/api/auth/get-profile', {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar perfil')
      }

      const { perfil } = data

      // Store profile in localStorage for compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('userProfile', JSON.stringify(perfil))
      }

      // Redirect based on user type
      // Note: Loja, entregador and admin dashboards are not tenant-specific
      switch (perfil.tipo) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'loja':
          router.push('/loja/dashboard')
          break
        case 'entregador':
          router.push('/entregador/dashboard')
          break
        default:
          // Clientes go to tenant home
          const basePath = tenant ? `/${tenant.slug}` : ''
          router.push(basePath || '/')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (registerData.tipo === 'loja' && !registerData.nome_loja) {
        throw new Error('O nome da loja é obrigatório')
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta')
      }

      // Automatically login after successful registration
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: registerData.email,
        password: registerData.password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao fazer login automático')
      }

      // Get user profile via API (bypasses RLS)
      // Send access token in Authorization header for localStorage-based auth
      const session = (await supabase.auth.getSession()).data.session
      const profileResponse = await fetch('/api/auth/get-profile', {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      })
      const profileData = await profileResponse.json()

      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Erro ao buscar perfil')
      }

      const { perfil } = profileData

      // Store profile in localStorage for compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('userProfile', JSON.stringify(perfil))
      }

      // Redirect based on user type
      switch (perfil.tipo) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'loja':
          router.push('/loja/dashboard')
          break
        case 'entregador':
          router.push('/entregador/dashboard')
          break
        default:
          // Clientes go to tenant home
          const basePath = tenant ? `/${tenant.slug}` : ''
          router.push(basePath || '/')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
      {/* Tabs */}
      <div className="flex mb-6 bg-gray-900 rounded-lg p-1">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
            isLogin
              ? 'bg-tenant-primary text-tenant-secondary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
            !isLogin
              ? 'bg-tenant-primary text-tenant-secondary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Cadastrar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-tenant-primary text-tenant-secondary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center">
            <Link href="/auth/recuperar-senha" className="text-sm text-tenant-primary hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Conta
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRegisterData({ ...registerData, tipo: 'cliente' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  registerData.tipo === 'cliente'
                    ? 'border-tenant-primary bg-tenant-primary/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-medium text-white">Cliente</div>
              </button>
              <button
                type="button"
                onClick={() => setRegisterData({ ...registerData, tipo: 'loja' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  registerData.tipo === 'loja'
                    ? 'border-tenant-primary bg-tenant-primary/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">🏪</div>
                <div className="text-sm font-medium text-white">Loja</div>
              </button>
              <button
                type="button"
                onClick={() => setRegisterData({ ...registerData, tipo: 'entregador' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  registerData.tipo === 'entregador'
                    ? 'border-tenant-primary bg-tenant-primary/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">🏍️</div>
                <div className="text-sm font-medium text-white">Entregador</div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="register-nome" className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              id="register-nome"
              type="text"
              required
              value={registerData.nome}
              onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
              placeholder="Seu nome completo"
            />
          </div>

          {registerData.tipo === 'loja' && (
            <div>
              <label htmlFor="register-loja" className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Loja
              </label>
              <input
                id="register-loja"
                type="text"
                required
                value={registerData.nome_loja}
                onChange={(e) => setRegisterData({ ...registerData, nome_loja: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
                placeholder="Nome da sua loja"
              />
            </div>
          )}

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-tenant-primary text-tenant-secondary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
      )}
    </div>
  )
}
