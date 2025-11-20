'use client'

import { ReactNode } from 'react'
import { CartProvider } from '@/lib/contexts/CartContext'
import { AuthProvider } from '@/lib/contexts/AuthContext' // <--- Importar o AuthContext

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    // Envolve tudo com o AuthProvider primeiro, depois o CartProvider
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  )
}