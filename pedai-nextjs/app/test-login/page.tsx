'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestLogin() {
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const testLogin = async () => {
    setStatus('Testando...')
    setLogs([])

    try {
      addLog('1. Criando cliente Supabase...')
      const supabase = createClient()

      addLog('2. Tentando fazer login com admin@pedai.com...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@pedai.com',
        password: 'admin123',
      })

      if (authError) {
        addLog(`❌ ERRO DE AUTENTICAÇÃO: ${authError.message}`)
        setStatus('Erro no login')
        return
      }

      addLog(`✅ Login bem-sucedido! User ID: ${authData.user?.id}`)

      addLog('3. Verificando sessão...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        addLog(`✅ Sessão encontrada! Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
      } else {
        addLog('❌ Sessão não encontrada!')
      }

      addLog('4. Chamando API /api/auth/get-profile...')
      const response = await fetch('/api/auth/get-profile')
      const data = await response.json()

      if (response.ok) {
        addLog(`✅ Perfil recebido: ${JSON.stringify(data.perfil)}`)
        setStatus('Sucesso total!')
      } else {
        addLog(`❌ Erro ao buscar perfil: ${data.error}`)
        setStatus('Login OK, mas perfil falhou')
      }

    } catch (error: any) {
      addLog(`❌ ERRO FATAL: ${error.message}`)
      setStatus('Erro fatal')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Teste de Login</h1>
        
        <button
          onClick={testLogin}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold mb-6"
        >
          Testar Login Admin
        </button>

        {status && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <strong>Status:</strong> {status}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-bold mb-2">Logs:</h2>
          <div className="space-y-1 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Clique no botão para iniciar o teste</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
