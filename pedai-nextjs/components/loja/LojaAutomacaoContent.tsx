'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Configuração dos sons disponíveis (URLs do seu projeto)
const OPCOES_SONS = [
  { 
    id: 'campainha_longa', 
    label: 'Campainha Longa', 
    url: 'https://jrskruadcwuytvjeqybh.supabase.co/storage/v1/object/public/sons/scholl_bell_ring.mp3' 
  },
  { 
    id: 'campainha_curta', 
    label: 'Campainha Curta', 
    url: 'https://jrskruadcwuytvjeqybh.supabase.co/storage/v1/object/public/sons/sino_bell_hop.mp3' 
  },
  { 
    id: 'classico', 
    label: 'Clássico', 
    url: 'https://jrskruadcwuytvjeqybh.supabase.co/storage/v1/object/public/sons/classic.mp3' 
  }
]

export default function LojaAutomacaoContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lojaId, setLojaId] = useState<number | null>(null)
  
  // Referência para o áudio tocando atualmente
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [config, setConfig] = useState({
    msg_auto_aceite: false,
    msg_auto_entrega: false,
    msg_auto_avaliacao: false,
    som_notificacao: 'campainha_longa'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: loja } = await supabase
      .from('lojas')
      .select('id, msg_auto_aceite, msg_auto_entrega, msg_auto_avaliacao, som_notificacao')
      .eq('user_id', user.id)
      .single()

    if (loja) {
      setLojaId(loja.id)
      
      // Verifica se o som salvo ainda existe na lista, senão usa o padrão
      const somSalvo = OPCOES_SONS.find(s => s.id === loja.som_notificacao) 
        ? loja.som_notificacao 
        : 'campainha_longa'

      setConfig({
        msg_auto_aceite: loja.msg_auto_aceite || false,
        msg_auto_entrega: loja.msg_auto_entrega || false,
        msg_auto_avaliacao: loja.msg_auto_avaliacao || false,
        som_notificacao: somSalvo
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!lojaId) return
    setSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('lojas')
      .update(config)
      .eq('id', lojaId)

    setSaving(false)
    if (error) alert('Erro ao salvar: ' + error.message)
    else alert('Automações atualizadas com sucesso!')
  }

  // Função de tocar som (com "Stop" automático)
  const playSound = (somId: string) => {
    const opcao = OPCOES_SONS.find(s => s.id === somId)
    
    if (opcao) {
      // 1. Se já tiver um áudio tocando, para ele imediatamente
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0 // Volta para o início
      }

      // 2. Cria o novo áudio e guarda na referência
      const audio = new Audio(opcao.url)
      audioRef.current = audio

      // 3. Toca o novo som
      audio.play().catch(e => console.error("Erro ao reproduzir som:", e))
    }
  }

  if (loading) return <div className="text-white p-8 text-center">Carregando robô...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/loja/dashboard')} className="text-gray-400 hover:text-white text-2xl">←</button>
          <div>
            <h1 className="text-3xl font-bold text-white">Automação & Robô</h1>
            <p className="text-gray-400 text-sm">Deixe o sistema trabalhar por você</p>
          </div>
        </div>

        <div className="grid gap-6">
          
          {/* Configuração de Notificações Sonoras */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🔔 Sons de Notificação
            </h2>
            <p className="text-gray-400 text-sm mb-6">Escolha qual som vai tocar na cozinha quando chegar um novo pedido.</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {OPCOES_SONS.map((som) => (
                <div 
                  key={som.id}
                  onClick={() => { setConfig({...config, som_notificacao: som.id}); playSound(som.id) }}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 h-24 ${
                    config.som_notificacao === som.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                  }`}
                >
                  <span className="text-white font-medium text-center">{som.label}</span>
                  {config.som_notificacao === som.id && <span className="text-xs text-primary font-bold">Selecionado</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Configuração de Mensagens Automáticas (WhatsApp) */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🤖 Mensagens Automáticas
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              O sistema pode abrir o WhatsApp automaticamente com uma mensagem pronta quando você mudar o status do pedido.
            </p>

            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-white font-bold">Ao Aceitar Pedido</h3>
                  <p className="text-xs text-gray-400">"Olá [Nome], confirmamos seu pedido e já estamos preparando!"</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, msg_auto_aceite: !config.msg_auto_aceite})}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${config.msg_auto_aceite ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.msg_auto_aceite ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-white font-bold">Ao Sair para Entrega</h3>
                  <p className="text-xs text-gray-400">"Seu pedido saiu para entrega! O motoboy está a caminho."</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, msg_auto_entrega: !config.msg_auto_entrega})}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${config.msg_auto_entrega ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.msg_auto_entrega ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-white font-bold">Pedir Avaliação</h3>
                  <p className="text-xs text-gray-400">Enviar link de avaliação após concluir o pedido.</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, msg_auto_avaliacao: !config.msg_auto_avaliacao})}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${config.msg_auto_avaliacao ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.msg_auto_avaliacao ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-secondary font-bold py-3 px-8 rounded-lg hover:opacity-90 shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

      </div>
    </div>
  )
}