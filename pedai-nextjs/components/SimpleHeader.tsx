'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'
import type { TenantConfig } from '@/lib/types/tenant'
import { useAuth } from '@/lib/contexts/AuthContext' // Importa o contexto

interface SimpleHeaderProps {
  tenant?: TenantConfig
}

export default function SimpleHeader({ tenant }: SimpleHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // USA O CONTEXTO EM VEZ DE BUSCAR NO BANCO
  const { profile, loja, loading, setLojaAberta } = useAuth()
  const [loadingStatus, setLoadingStatus] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/'
  }

  const toggleLojaStatus = async () => {
    if (!loja) return
    setLoadingStatus(true)
    const novoStatus = !loja.aberta
    
    // Atualiza visualmente na hora via Contexto
    setLojaAberta(novoStatus)
    
    const supabase = createClient()
    await supabase.from('lojas').update({ aberta: novoStatus }).eq('id', loja.id)
    
    setLoadingStatus(false)
  }
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])
  
  const basePath = tenant ? `/${tenant.slug}` : ''
  let homeUrl = basePath || '/'
  if (profile?.tipo === 'loja' && loja?.municipio) {
    homeUrl = `/${loja.municipio}`
  }
  
  const lojasUrl = `${basePath}/lojas`
  const loginUrl = `${basePath}/auth/login`
  const primaryColor = tenant?.theme.primary || '#FFD100'

  // Define link do perfil
  const getProfileLink = () => {
    if (profile?.tipo === 'loja') return '/loja/configuracoes'
    if (profile?.tipo === 'admin') return '/admin/configuracoes'
    return `${basePath}/perfil`
  }

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md z-50 sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href={homeUrl} className="flex items-center">
            <Logo tenant={tenant} />
          </Link>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-2">
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>

          <nav className="hidden md:flex items-center space-x-6">
            {/* BOTÃO DE STATUS */}
            {profile?.tipo === 'loja' && loja && (
              <button 
                onClick={toggleLojaStatus}
                disabled={loadingStatus}
                className={`px-4 py-2 rounded-full font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                  loja.aberta 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full bg-white ${loadingStatus ? 'animate-pulse' : ''}`}></span>
                {loja.aberta ? 'ABERTA' : 'FECHADA'}
              </button>
            )}

            <Link href={homeUrl} className="transition-colors text-white hover:text-primary">Início</Link>
            
            {profile?.tipo === 'loja' ? (
              <Link href="/loja/dashboard" className="transition-colors text-white hover:text-primary">Dashboard</Link>
            ) : (
              <>
                <Link href={lojasUrl} className="transition-colors text-white hover:text-primary">Lojas</Link>
                {profile?.tipo === 'cliente' && <Link href={`${basePath}/meus-pedidos`} className="transition-colors text-white hover:text-primary">Meus Pedidos</Link>}
                <Link href="/" className="transition-colors text-white hover:text-primary">Municípios</Link>
                {profile?.tipo === 'admin' && <Link href="/admin/dashboard" className="transition-colors text-white hover:text-primary">Dashboard</Link>}
              </>
            )}

            {/* USER INFO - Sem loading skeleton para evitar piscar */}
            {profile ? (
              <>
                <Link href={getProfileLink()} className="text-white font-medium hover:text-primary hover:underline transition-all">
                  Olá, {loja?.nome_loja || profile.nome_completo.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} className="font-medium py-2 px-6 rounded-full hover:opacity-90 transition-opacity bg-red-500 text-white">Sair</button>
              </>
            ) : (
              !loading && (
                <Link href={loginUrl} className="font-medium py-2 px-6 rounded-full hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor, color: tenant?.theme.secondary || '#1A1A1A' }}>Entrar</Link>
              )
            )}
          </nav>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col space-y-3">
             {profile?.tipo === 'loja' && loja && (
                <button onClick={toggleLojaStatus} className={`w-full px-4 py-3 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${loja.aberta ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  <span className={`w-2 h-2 rounded-full bg-white ${loadingStatus ? 'animate-pulse' : ''}`}></span>
                  {loja.aberta ? 'LOJA ABERTA' : 'LOJA FECHADA'}
                </button>
              )}
              <Link href={homeUrl} onClick={() => setMobileMenuOpen(false)} className="text-white py-2">Início</Link>
              {profile ? (
                <>
                   <Link href={getProfileLink()} className="text-white font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Olá, {loja?.nome_loja || profile.nome_completo.split(' ')[0]}</Link>
                   <button onClick={handleLogout} className="text-red-400 py-2 text-left">Sair</button>
                </>
              ) : (
                <Link href={loginUrl} className="text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
              )}
          </nav>
        )}
      </div>
    </header>
  )
}