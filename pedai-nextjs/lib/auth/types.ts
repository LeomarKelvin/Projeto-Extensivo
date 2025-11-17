export type UserType = 'cliente' | 'loja' | 'entregador'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  nome_completo: string
  tipo: UserType
  created_at?: string
  updated_at?: string
}

export interface RegisterData {
  email: string
  password: string
  nome: string
  tipo: UserType
  nome_loja?: string
}

export interface LoginData {
  email: string
  password: string
}
