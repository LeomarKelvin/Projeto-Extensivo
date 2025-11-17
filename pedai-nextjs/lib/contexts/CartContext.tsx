'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  produto_id: string
  nome: string
  preco: number
  quantidade: number
  observacao?: string
  loja_id: string
  loja_nome: string
  imagem_url?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantidade: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems(currentItems => {
      // Check if item from same store exists
      const existingItem = currentItems.find(
        item => item.produto_id === newItem.produto_id && item.loja_id === newItem.loja_id
      )

      if (existingItem) {
        // Update quantity if item exists
        return currentItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantidade: item.quantidade + newItem.quantidade }
            : item
        )
      }

      // Add new item
      return [
        ...currentItems,
        {
          ...newItem,
          id: `${newItem.produto_id}-${Date.now()}`,
        },
      ]
    })
  }

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(id)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantidade } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
