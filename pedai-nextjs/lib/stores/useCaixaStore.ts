import { create } from 'zustand'

interface CaixaState {
  isOpen: boolean
  caixaId: number | null
  setCaixaStatus: (isOpen: boolean, id: number | null) => void
}

export const useCaixaStore = create<CaixaState>((set) => ({
  isOpen: false,
  caixaId: null,
  setCaixaStatus: (isOpen, id) => set({ isOpen, caixaId: id }),
}))