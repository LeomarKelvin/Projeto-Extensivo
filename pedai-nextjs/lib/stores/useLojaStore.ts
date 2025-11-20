import { create } from 'zustand'

interface HorarioDia {
  dia: string
  ativo: boolean
  inicio: string
  fim: string
}

interface LojaConfig {
  id: number
  nome_loja: string
  municipio: string
  aberta: boolean
  tipo_horario: string
  horarios_funcionamento: HorarioDia[]
}

interface LojaState {
  config: LojaConfig | null
  setConfig: (config: LojaConfig) => void
  setAberta: (status: boolean) => void
}

export const useLojaStore = create<LojaState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  setAberta: (status) => set((state) => ({
    config: state.config ? { ...state.config, aberta: status } : null
  }))
}))