interface HorarioDia {
    dia: string
    ativo: boolean
    inicio: string
    fim: string
  }
  
  export function verificarLojaAberta(
    tipoHorario: string, 
    horarios: HorarioDia[] | null, 
    abertaManual: boolean
  ): boolean {
    // 1. Regras de bloqueio imediato
    if (tipoHorario === 'fechado') return false
    
    // 2. Se for manual ou não configurado, usa o botão
    if (!tipoHorario || tipoHorario === 'sempre_aberto') return abertaManual
  
    // 3. Se for agendado, tecnicamente a loja está "operando" para receber pedidos
    if (tipoHorario === 'agendado') return true 
  
    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) return abertaManual
  
    // 4. Obtém a hora exata em São Paulo (Brasília)
    // Usamos o dia numérico (0=Dom, 1=Seg...) para evitar erro de idioma
    const dataSP = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
    const dataAtual = new Date(dataSP);
  
    const diaSemanaNumerico = dataAtual.getDay(); // 0 = Domingo, 1 = Segunda...
    const horas = dataAtual.getHours();
    const minutos = dataAtual.getMinutes();
  
    // Mapa para traduzir número para a string do seu JSON ('Seg', 'Ter'...)
    // Ordem do getDay(): 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    const mapaDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaAtualStr = mapaDias[diaSemanaNumerico];
  
    // 5. Busca a regra de hoje
    const configHoje = horarios.find(h => h.dia === diaAtualStr);
  
    // Debug no console do servidor para você ver o que está acontecendo
    console.log(`[ShopStatus] Agora: ${diaAtualStr} ${horas}:${minutos} | Regra:`, configHoje);
  
    // Se não tem regra pra hoje ou está desmarcado
    if (!configHoje || !configHoje.ativo) return false;
  
    // Se as horas estiverem vazias, considera fechado
    if (!configHoje.inicio || !configHoje.fim) return false;
  
    // 6. Cálculo de Minutos
    const minutosAtuais = (horas * 60) + minutos;
    
    const [iniH, iniM] = configHoje.inicio.split(':').map(Number);
    const [fimH, fimM] = configHoje.fim.split(':').map(Number);
    
    const minutosInicio = (iniH * 60) + iniM;
    const minutosFim = (fimH * 60) + fimM;
  
    // 7. Comparação Final
    if (minutosFim < minutosInicio) {
      // Madrugada (ex: abre 20:00, fecha 02:00)
      return minutosAtuais >= minutosInicio || minutosAtuais <= minutosFim;
    } else {
      // Dia normal (ex: 08:00 as 18:00)
      return minutosAtuais >= minutosInicio && minutosAtuais <= minutosFim;
    }
  }