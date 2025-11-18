'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'
import type { TenantConfig } from '@/lib/types/tenant'

interface SimpleHeaderProps {
  tenant?: TenantConfig
}

interface UserProfile {
  id: number
  nome_completo: string
  tipo: string
  email: string
}

interface Loja {
  nome_loja: string
}

export default function SimpleHeader({ tenant }: SimpleHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [lojaName, setLojaName] = useState<string | null>(null)
  const [lojaMunicipio, setLojaMunicipio] = useState<string | null>(null)
  
  // Check if user is logged in
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUserProfile(null)
        setLojaName(null)
        return
      }

      // Get user profile
      const profileResponse = await fetch('/api/auth/get-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setUserProfile(data.perfil)

        // If user is loja, get store name and municipality
        if (data.perfil.tipo === 'loja') {
          const { data: lojaData } = await supabase
            .from('lojas')
            .select('nome_loja, municipio')
            .eq('perfil_id', data.perfil.id)
            .single()
          
          if (lojaData) {
            setLojaName(lojaData.nome_loja)
            setLojaMunicipio(lojaData.municipio)
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/'
  }
  
  // Handle keyboard navigation for mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])
  
  // Build tenant-aware URLs (all routes maintain tenant context)
  const basePath = tenant ? `/${tenant.slug}` : ''
  
  // For lojistas, home URL points to their municipality
  let homeUrl = basePath || '/'
  if (userProfile?.tipo === 'loja' && lojaMunicipio) {
    homeUrl = `/${lojaMunicipio}`
  }
  
  const lojasUrl = `${basePath}/lojas`
  const loginUrl = `${basePath}/auth/login`

  const primaryColor = tenant?.theme.primary || '#FFD100'

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md z-50 sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href={homeUrl} className="flex items-center">
            <Logo tenant={tenant} />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href={homeUrl}
              className="transition-colors text-white"
              style={{ color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
            >
              Início
            </Link>
            {userProfile?.tipo === 'loja' ? (
              <Link 
                href="/loja/dashboard"
                className="transition-colors text-white"
                style={{ color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href={lojasUrl}
                  className="transition-colors text-white"
                  style={{ color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >
                  Lojas
                </Link>
                {userProfile?.tipo === 'cliente' && (
                  <Link 
                    href={`${basePath}/meus-pedidos`}
                    className="transition-colors text-white"
                    style={{ color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    Meus Pedidos
                  </Link>
                )}
                <Link 
                  href="/"
                  className="transition-colors text-white"
                  style={{ color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >
                  Municípios
                </Link>
              </>
            )}
            {userProfile ? (
              <>
                <span className="text-white font-medium">
                  Olá, {lojaName || userProfile.nome_completo.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="font-medium py-2 px-6 rounded-full hover:opacity-90 transition-opacity bg-red-500 text-white"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href={loginUrl}
                className="font-medium py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: primaryColor,
                  color: tenant?.theme.secondary || '#1A1A1A',
                }}
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-menu"
            className="md:hidden mt-4 pb-4 flex flex-col space-y-3"
            role="navigation"
            aria-label="Menu mobile"
          >
            <Link 
              href={homeUrl}
              className="text-white hover:opacity-80 transition-opacity py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Início
            </Link>
            {userProfile?.tipo === 'loja' ? (
              <Link 
                href="/loja/dashboard"
                className="text-white hover:opacity-80 transition-opacity py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href={lojasUrl}
                  className="text-white hover:opacity-80 transition-opacity py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Lojas
                </Link>
                {userProfile?.tipo === 'cliente' && (
                  <Link 
                    href={`${basePath}/meus-pedidos`}
                    className="text-white hover:opacity-80 transition-opacity py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Meus Pedidos
                  </Link>
                )}
                <Link 
                  href="/"
                  className="text-white hover:opacity-80 transition-opacity py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Municípios
                </Link>
              </>
            )}
            {userProfile ? (
              <>
                <span className="text-white font-medium py-2">
                  Olá, {lojaName || userProfile.nome_completo.split(' ')[0]}
                </span>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="font-medium py-2 px-6 rounded-full text-center hover:opacity-90 transition-opacity bg-red-500 text-white"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href={loginUrl}
                className="font-medium py-2 px-6 rounded-full text-center hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: primaryColor,
                  color: tenant?.theme.secondary || '#1A1A1A',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
