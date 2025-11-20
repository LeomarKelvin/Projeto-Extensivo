interface HorarioDia {
  dia: string
  ativo: boolean
  inicio: string
  fim: string
}

export function verificarLojaAberta(
  tipoHorario: string | null, 
  horarios: HorarioDia[] | null, 
  abertaManual: boolean
): boolean {
  // 1. Se o dono clicou manualmente em "FECHAR" (Botão Vermelho), a loja fecha, ponto.
  if (abertaManual === false) return false

  // 2. Regras Fixas
  if (!tipoHorario || tipoHorario === 'sempre_aberto') return true
  if (tipoHorario === 'fechado') return false
  
  // 3. Lógica de Horário (Agora vale para "Dias Específicos" E "Agendado")
  if (tipoHorario === 'dias_especificos' || tipoHorario === 'agendado') {
    
    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) return false

    // Pega hora oficial de Brasília
    const dataAtual = new Date()
    const opcoes: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false
    }
    
    const formatador = new Intl.DateTimeFormat('pt-BR', opcoes)
    const partes = formatador.formatToParts(dataAtual)
    
    const diaSemanaMap: Record<string, string> = {
      'seg.': 'Seg', 'ter.': 'Ter', 'qua.': 'Qua', 'qui.': 'Qui', 
      'sex.': 'Sex', 'sáb.': 'Sáb', 'dom.': 'Dom',
      'seg': 'Seg', 'ter': 'Ter', 'qua': 'Qua', 'qui': 'Qui', 
      'sex': 'Sex', 'sáb': 'Sáb', 'dom': 'Dom'
    }
    
    const diaRaw = partes.find(p => p.type === 'weekday')?.value.toLowerCase() || ''
    const horaAtual = parseInt(partes.find(p => p.type === 'hour')?.value || '0')
    const minAtual = parseInt(partes.find(p => p.type === 'minute')?.value || '0')
    
    const diaAtual = diaSemanaMap[diaRaw] || 'Dom' 

    // Busca regra de hoje
    const configHoje = horarios.find(h => h.dia === diaAtual)

    // Se hoje está desmarcado ou sem horário, fecha
    if (!configHoje || !configHoje.ativo) return false
    if (!configHoje.inicio || !configHoje.fim) return false

    // Compara minutos
    const minutosAgora = (horaAtual * 60) + minAtual
    const [hIni, mIni] = configHoje.inicio.split(':').map(Number)
    const [hFim, mFim] = configHoje.fim.split(':').map(Number)
    const minutosInicio = (hIni * 60) + mIni
    const minutosFim = (hFim * 60) + mFim

    // Lógica de Madrugada vs Dia Normal
    // CORREÇÃO: Usamos '<' (menor estrito) para o horário final
    if (minutosFim < minutosInicio) {
      // Madrugada (ex: 18:00 as 02:00)
      return minutosAgora >= minutosInicio || minutosAgora < minutosFim
    } else {
      // Dia normal (ex: 08:00 as 18:00)
      return minutosAgora >= minutosInicio && minutosAgora < minutosFim
    }
  }

  return abertaManual
}