'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: number
  nome_completo: string
  tipo: string
  email: string
}

interface LojaData {
  id: number
  nome_loja: string
  municipio: string
  aberta: boolean
}

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  loja: LojaData | null
  loading: boolean
  refreshAuth: () => Promise<void>
  setLojaAberta: (status: boolean) => void // Para atualizar o botão sem recarregar
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loja, setLoja] = useState<LojaData | null>(null)
  const [loading, setLoading] = useState(true)

  // Função que busca os dados (só roda 1 vez)
  const refreshAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUser(null)
        setProfile(null)
        setLoja(null)
        setLoading(false)
        return
      }

      setUser(session.user)

      // Busca perfil via API para garantir segurança e consistência
      const profileResponse = await fetch('/api/auth/get-profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setProfile(data.perfil)

        // Se for loja, busca os dados dela também
        if (data.perfil.tipo === 'loja') {
          const { data: lojaData } = await supabase
            .from('lojas')
            .select('id, nome_loja, municipio, aberta')
            .eq('perfil_id', data.perfil.id)
            .single()
          
          if (lojaData) setLoja(lojaData)
        }
      }
    } catch (error) {
      console.error('Erro no AuthContext:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAuth()
  }, [])

  // Função para o botão de abrir/fechar atualizar o estado global na hora
  const setLojaAberta = (status: boolean) => {
    if (loja) {
      setLoja({ ...loja, aberta: status })
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loja, loading, refreshAuth, setLojaAberta }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)