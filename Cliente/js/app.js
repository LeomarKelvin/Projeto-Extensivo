function adicionarAoCarrinho(nomeDoProduto, precoDoProduto) {
    // Pega o carrinho existente ou cria um novo.
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // VERIFICA SE O ITEM JÁ EXISTE NO CARRINHO
    let itemExistente = carrinho.find(item => item.nome === nomeDoProduto);

    if (itemExistente) {
        // Se o item já existe, apenas aumenta a quantidade.
        itemExistente.quantidade++;
    } else {
        // Se é um item novo, adiciona à lista com quantidade 1.
        carrinho.push({
            nome: nomeDoProduto,
            preco: precoDoProduto,
            quantidade: 1 
        });
    }

    // Salva o carrinho atualizado de volta no localStorage.
    localStorage.setItem('carrinho', JSON.stringify(carrinho));

    // Avisa o usuário.
    alert(nomeDoProduto + " foi adicionado/atualizado no carrinho!");
}