'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import SimpleHeader from './SimpleHeader'
import Footer from './Footer'
import type { TenantConfig } from '@/lib/types/tenant'
import LojaSidebar from './loja/LojaSidebar' // Importa a Sidebar nova

interface ClientLayoutProps {
  children: ReactNode
  tenant?: TenantConfig
  showCart?: boolean
}

export default function ClientLayout({ children, tenant }: ClientLayoutProps) {
  const pathname = usePathname()

  // Lógica para mostrar a Sidebar
  // 1. Deve começar com '/loja'
  // 2. NÃO pode ser o '/loja/dashboard' (lá usamos os cards grandes)
  // 3. NÃO pode ser login/auth
  const isLojaRoute = pathname?.startsWith('/loja')
  const isDashboard = pathname === '/loja/dashboard'
  const showSidebar = isLojaRoute && !isDashboard

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header Fixo no Topo */}
      <SimpleHeader tenant={tenant} />
      
      {/* Área Principal (Flexbox para colocar Sidebar ao lado do Conteúdo) */}
      <div className="flex flex-1">
        
        {/* Renderiza Sidebar Condicionalmente */}
        {showSidebar && <LojaSidebar />}

        {/* Conteúdo da Página */}
        <main className="flex-1 relative flex flex-col min-w-0">
          {children}
        </main>

      </div>
      
      {/* Footer */}
      <Footer tenant={tenant} />
    </div>
  )
}