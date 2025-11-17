'use client'

import { ReactNode, useEffect } from 'react'
import SimpleHeader from './SimpleHeader'
import Footer from './Footer'
import CartButton from './CartButton'
import type { TenantConfig } from '@/lib/types/tenant'

interface ClientLayoutProps {
  children: ReactNode
  tenant?: TenantConfig
  showHeader?: boolean
  showFooter?: boolean
  showCart?: boolean
}

export default function ClientLayout({ 
  children, 
  tenant,
  showHeader = true,
  showFooter = true,
  showCart = true
}: ClientLayoutProps) {
  // Inject CSS variables into document root for tenant theming
  useEffect(() => {
    if (tenant) {
      document.documentElement.style.setProperty('--color-primary', tenant.theme.primary)
      document.documentElement.style.setProperty('--color-secondary', tenant.theme.secondary)
      document.documentElement.style.setProperty('--color-accent', tenant.theme.accent)
    } else {
      // Reset to default colors when no tenant
      document.documentElement.style.setProperty('--color-primary', '#FFD100')
      document.documentElement.style.setProperty('--color-secondary', '#1A1A1A')
      document.documentElement.style.setProperty('--color-accent', '#FFFFFF')
    }
  }, [tenant])

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <SimpleHeader tenant={tenant} />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer tenant={tenant} />}
      {showCart && <CartButton tenant={tenant} />}
    </div>
  )
}
