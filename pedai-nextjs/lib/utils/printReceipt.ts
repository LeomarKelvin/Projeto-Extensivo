export const imprimirComanda = (pedido: any, lojaNome: string) => {
    // Garante que os valores sejam números
    const subtotal = Number(pedido.subtotal || 0);
    const taxaEntrega = Number(pedido.taxa_entrega || 0);
    const total = Number(pedido.total || 0);
    const troco = pedido.troco_para ? Number(pedido.troco_para) : 0;
    const data = new Date(pedido.created_at).toLocaleString('pt-BR');
  
    // Formata itens
    const itensHtml = pedido.items?.map((item: any) => `
      <div style="margin-bottom: 5px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${item.quantidade}x ${item.produto?.nome || 'Item'}</span>
          <span>R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}</span>
        </div>
        ${item.observacao ? `<div style="font-size: 10px; margin-top: 2px;">OBS: ${item.observacao}</div>` : ''}
      </div>
    `).join('') || '';
  
    // Conteúdo da Comanda (HTML para impressora térmica 80mm)
    const conteudo = `
      <html>
        <head>
          <title>Pedido #${pedido.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0; padding: 5px; color: #000; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; font-weight: bold; }
            .info { margin-bottom: 10px; font-size: 11px; }
            .info p { margin: 2px 0; }
            .items { margin-bottom: 10px; }
            .totals { margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; }
            .totals div { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-final { font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print { @page { margin: 0; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${lojaNome}</h1>
            <p>Pedido #${pedido.id}</p>
            <p>${data}</p>
          </div>
  
          <div class="info">
            <p><strong>Cliente:</strong> ${pedido.cliente_nome || pedido.perfil?.nome_completo || 'Balcão'}</p>
            <p><strong>Tel:</strong> ${pedido.cliente_telefone || pedido.perfil?.telefone || '-'}</p>
            <p><strong>Endereço:</strong> ${pedido.endereco_entrega}</p>
            ${pedido.tipo_entrega === 'retirada' ? '<p style="font-weight:bold; margin-top:5px;">* RETIRADA NA LOJA *</p>' : ''}
          </div>
  
          <div class="items">
            ${itensHtml}
          </div>
  
          <div class="totals">
            <div><span>Subtotal:</span> <span>R$ ${subtotal.toFixed(2)}</span></div>
            <div><span>Taxa Entrega:</span> <span>R$ ${taxaEntrega.toFixed(2)}</span></div>
            
            <div class="total-final">
              <span>TOTAL:</span> 
              <span>R$ ${total.toFixed(2)}</span>
            </div>
            
            <div style="margin-top: 10px; font-weight: bold;">
              Pagamento: ${pedido.forma_pagamento?.toUpperCase()}
            </div>
            
            ${troco > 0 ? `<div><span>Troco para:</span> <span>R$ ${troco.toFixed(2)}</span></div>` : ''}
            ${troco > 0 ? `<div><span>Levar Troco:</span> <span>R$ ${(troco - total).toFixed(2)}</span></div>` : ''}
          </div>
  
          ${pedido.observacoes ? `
            <div style="margin-top: 15px; border: 1px solid #000; padding: 5px; background: #eee;">
              <strong>⚠️ OBSERVAÇÃO:</strong><br/>
              ${pedido.observacoes}
            </div>
          ` : ''}
  
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>www.pedeai.com.br</p>
          </div>
  
          <script>
            // Imprime automaticamente e fecha a janela
            window.onload = function() { 
              window.print(); 
              // setTimeout(function(){ window.close(); }, 500); // Opcional: fechar auto
            }
          </script>
        </body>
      </html>
    `;
  
    // Abre janela de impressão
    const janela = window.open('', '_blank', 'width=400,height=600');
    if (janela) {
      janela.document.write(conteudo);
      janela.document.close();
    } else {
      alert('Por favor, permita pop-ups para imprimir a comanda!');
    }
  };