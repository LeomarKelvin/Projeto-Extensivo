import { ReactNode } from 'react'
import SimpleHeader from './SimpleHeader'
import Footer from './Footer'
import CartButton from './CartButton'
import TenantTheme from './TenantTheme'
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
  return (
    <>
      <TenantTheme tenant={tenant} />
      <div className="min-h-screen flex flex-col">
        {showHeader && <SimpleHeader tenant={tenant} />}
        <main className="flex-grow">
          {children}
        </main>
        {showFooter && <Footer tenant={tenant} />}
        {showCart && <CartButton tenant={tenant} />}
      </div>
    </>
  )
}
