function adicionarAoCarrinho(nomeDoProduto, precoDoProduto, lojaId) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Lógica para permitir apenas uma loja por vez no carrinho
    if (carrinho.length > 0 && carrinho[0].lojaId !== lojaId) {
        const confirmClear = confirm('Você já tem itens de outra loja no carrinho. Deseja esvaziar o carrinho e adicionar este novo item?');
        if (confirmClear) {
            carrinho = []; // Esvazia o carrinho
        } else {
            return; // Cancela a adição
        }
    }

    let itemExistente = carrinho.find(item => item.nome === nomeDoProduto);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            nome: nomeDoProduto,
            preco: precoDoProduto,
            quantidade: 1,
            lojaId: lojaId // Guarda o ID da loja junto com o item
        });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    showToast('Carrinho', `${nomeDoProduto} foi adicionado com sucesso!`);
    updateHeader();
}