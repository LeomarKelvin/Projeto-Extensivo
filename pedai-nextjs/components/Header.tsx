'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from './Logo'
import type { TenantConfig } from '@/lib/types/tenant'

interface HeaderProps {
  tenant?: TenantConfig
}

interface UserData {
  id: string
  nome_completo?: string
  email: string
  tipo_usuario: 'cliente' | 'loja' | 'entregador' | 'admin'
}

export default function Header({ tenant }: HeaderProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Verificar se há usuário logado
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Erro ao parsear userData:', e)
      }
    }

    // Verificar carrinho
    const cart = localStorage.getItem('pedeai_cart')
    if (cart) {
      try {
        const cartItems = JSON.parse(cart)
        const total = cartItems.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)
        setCartCount(total)
      } catch (e) {
        console.error('Erro ao parsear carrinho:', e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('pedeai_cart')
    setUser(null)
    window.location.href = '/auth/login'
  }

  const primaryColor = tenant?.theme.primary || '#FFD100'

  if (!user) {
    // Header deslogado
    return (
      <header className="bg-gray-900 text-white p-4 shadow-md z-50 sticky top-0">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Logo tenant={tenant} />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link 
              href="/"
              className={`hover:text-primary transition-colors ${pathname === '/' ? 'text-primary' : 'text-white'}`}
            >
              Início
            </Link>
            <Link 
              href="/lojas"
              className={`hover:text-primary transition-colors ${pathname === '/lojas' ? 'text-primary' : 'text-white'}`}
            >
              Lojas
            </Link>
            <Link
              href="/auth/login"
              className="bg-primary text-secondary font-medium py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  // Header logado
  const primeiroNome = user.nome_completo 
    ? user.nome_completo.split(' ')[0] 
    : user.email.split('@')[0]

  return (
    <header className="bg-secondary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Logo tenant={tenant} />
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              href="/"
              className={`transition-colors ${pathname === '/' ? 'text-primary' : 'text-white hover:text-primary'}`}
            >
              Início
            </Link>
            <Link 
              href="/lojas"
              className={`transition-colors ${pathname === '/lojas' ? 'text-primary' : 'text-white hover:text-primary'}`}
            >
              Lojas
            </Link>
            <Link 
              href="/pedidos"
              className={`transition-colors ${pathname === '/pedidos' ? 'text-primary' : 'text-white hover:text-primary'}`}
            >
              Meus Pedidos
            </Link>
            <Link 
              href="/perfil"
              className="font-medium text-primary hover:text-white transition-colors"
            >
              Olá, {primeiroNome}
            </Link>
            
            <Link 
              href="/carrinho"
              className="relative text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-secondary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Sair
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
