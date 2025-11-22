export const imprimirRelatorioCaixa = (sessao: any, movimentos: any[], lojaNome: string, larguraMm: number = 80) => {
    const dataAbertura = new Date(sessao.data_abertura).toLocaleString('pt-BR');
    const dataFechamento = sessao.data_fechamento ? new Date(sessao.data_fechamento).toLocaleString('pt-BR') : 'EM ABERTO';
    
    // Calcula totais
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalVendas = 0;
  
    movimentos.forEach(m => {
      if (m.tipo === 'sangria') totalSaidas += m.valor;
      else if (m.tipo === 'suprimento') totalEntradas += m.valor;
      else if (m.tipo === 'venda') totalVendas += m.valor;
    });
  
    const saldoFinal = (sessao.valor_abertura + totalEntradas + totalVendas) - totalSaidas;
  
    // Estilos
    const fontSize = larguraMm === 58 ? '10px' : '12px';
    const headerSize = larguraMm === 58 ? '12px' : '14px';
  
    const movimentosHtml = movimentos.map((m: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
        <div>
          <div style="font-weight: bold;">${m.tipo.toUpperCase()}</div>
          <div style="font-size: ${parseInt(fontSize) - 2}px; color: #555;">${new Date(m.created_at).toLocaleTimeString()} - ${m.descricao || ''}</div>
        </div>
        <div style="font-weight: bold;">${m.tipo === 'sangria' ? '-' : '+'} R$ ${m.valor.toFixed(2)}</div>
      </div>
    `).join('');
  
    const conteudo = `
      <html>
        <head>
          <title>Caixa #${sessao.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; width: ${larguraMm}mm; margin: 0; padding: 5px; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: ${headerSize}; margin: 0; text-transform: uppercase; }
            .section { margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .total-box { border: 2px solid #000; padding: 5px; margin-top: 10px; font-size: ${headerSize}; text-align: center; font-weight: bold; }
            @media print { @page { margin: 0; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${lojaNome}</h1>
            <p>Relatório de Caixa</p>
            <p>ID: #${sessao.id}</p>
          </div>
  
          <div class="section">
            <div class="row"><span>Abertura:</span> <span>${dataAbertura}</span></div>
            <div class="row"><span>Fechamento:</span> <span>${dataFechamento}</span></div>
            <div class="row"><span>Operador:</span> <span>${sessao.user_id ? 'Usuário' : 'Sistema'}</span></div>
          </div>
  
          <div class="divider"></div>
  
          <div class="section">
            <div class="row"><span>(+) Fundo Inicial:</span> <span>R$ ${sessao.valor_abertura.toFixed(2)}</span></div>
            <div class="row"><span>(+) Vendas:</span> <span>R$ ${totalVendas.toFixed(2)}</span></div>
            <div class="row"><span>(+) Suprimentos:</span> <span>R$ ${totalEntradas.toFixed(2)}</span></div>
            <div class="row"><span>(-) Sangrias:</span> <span>R$ ${totalSaidas.toFixed(2)}</span></div>
          </div>
  
          <div class="total-box">
            SALDO: R$ ${saldoFinal.toFixed(2)}
          </div>
  
          ${sessao.valor_fechamento ? `
            <div class="section" style="margin-top: 10px;">
              <div class="row"><span>Conferido:</span> <span>R$ ${sessao.valor_fechamento.toFixed(2)}</span></div>
              <div class="row"><span>Diferença:</span> <span>R$ ${(sessao.valor_fechamento - saldoFinal).toFixed(2)}</span></div>
            </div>
          ` : ''}
  
          <div class="divider"></div>
          <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">MOVIMENTAÇÕES</div>
          ${movimentosHtml}
  
          <div style="text-align: center; margin-top: 20px; font-size: 10px;">
            <p>_______________________________</p>
            <p>Assinatura do Responsável</p>
          </div>
  
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
  
    const janela = window.open('', '_blank', 'width=400,height=600');
    if (janela) {
      janela.document.write(conteudo);
      janela.document.close();
    }
  };