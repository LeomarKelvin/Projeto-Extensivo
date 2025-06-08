function adicionarAoCarrinho(nomeDoProduto, precoDoProduto, lojaId) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // LÓGICA ATUALIZADA: Chama o novo modal
    if (carrinho.length > 0 && carrinho[0].lojaId !== lojaId) {
        
        const onConfirmAction = () => {
            // Esta é a ação que acontece se o usuário clicar em "Sim"
            carrinho = []; // Esvazia o carrinho
            carrinho.push({
                nome: nomeDoProduto,
                preco: precoDoProduto,
                quantidade: 1,
                lojaId: lojaId
            });
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            updateHeader();
            showToast('Carrinho esvaziado', 'Um novo carrinho foi criado com o item da nova loja.');
        };

        // Mostra o modal personalizado
        showConfirmationModal(
            'Trocar de Loja?',
            'Seu carrinho contém itens de outra loja. Deseja limpá-lo para adicionar este novo item?',
            onConfirmAction
        );

    } else {
        // Se o carrinho está vazio ou o item é da mesma loja, adiciona normalmente
        let itemExistente = carrinho.find(item => item.nome === nomeDoProduto);
        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            carrinho.push({
                nome: nomeDoProduto,
                preco: precoDoProduto,
                quantidade: 1,
                lojaId: lojaId
            });
        }
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        showToast('Carrinho', `${nomeDoProduto} foi adicionado com sucesso!`);
        updateHeader();
    }
}