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
  const [isLoaded, setIsLoaded] = useState(false)

  // 1. Carrega do LocalStorage ao iniciar (Apenas no cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('pedai_cart_v2')
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (e) {
          console.error('Erro ao carregar carrinho', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // 2. Salva no LocalStorage a cada mudança
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('pedai_cart_v2', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems(currentItems => {
      // Verifica se é da mesma loja. Se não for, limpa o carrinho antigo (Regra de App de Delivery)
      if (currentItems.length > 0 && currentItems[0].loja_id !== newItem.loja_id) {
        if (!confirm(`Você tem itens de ${currentItems[0].loja_nome}. Deseja limpar o carrinho para adicionar itens de ${newItem.loja_nome}?`)) {
          return currentItems
        }
        return [{ ...newItem, id: `${newItem.produto_id}-${Date.now()}` }]
      }

      // Verifica se o item já existe (considerando observação)
      const existingItem = currentItems.find(
        item => item.produto_id === newItem.produto_id && item.observacao === newItem.observacao
      )

      if (existingItem) {
        return currentItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantidade: item.quantidade + newItem.quantidade }
            : item
        )
      }

      return [...currentItems, { ...newItem, id: `${newItem.produto_id}-${Date.now()}` }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantidade: number) => {
    if (quantidade <= 0) return removeItem(id)
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantidade } : item))
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== 'undefined') localStorage.removeItem('pedai_cart_v2')
  }

  const total = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) throw new Error('useCart must be used within a CartProvider')
  return context
}