'use client'

import Link from 'next/link'
import { useCart } from '@/lib/contexts/CartContext'
import type { TenantConfig } from '@/lib/types/tenant'

interface CartButtonProps {
  tenant?: TenantConfig
}

export default function CartButton({ tenant }: CartButtonProps) {
  const { itemCount, total } = useCart()
  const basePath = tenant ? `/${tenant.slug}` : ''

  if (itemCount === 0) return null

  return (
    <Link
      href={`${basePath}/carrinho`}
      className="fixed bottom-6 right-6 z-50 bg-tenant-primary text-tenant-secondary px-6 py-4 rounded-full shadow-2xl hover:opacity-90 transition-all flex items-center gap-3 font-semibold"
    >
      <span className="text-2xl">🛒</span>
      <div className="flex flex-col items-start">
        <span className="text-xs opacity-80">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        <span className="text-lg">R$ {total.toFixed(2)}</span>
      </div>
    </Link>
  )
}
