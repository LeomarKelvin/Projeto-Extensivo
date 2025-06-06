// js/carrinho.js

// Garante que o código só roda depois que a página do carrinho estiver carregada.
document.addEventListener('DOMContentLoaded', function() {
    exibirItensDoCarrinho();
});

function exibirItensDoCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const containerItens = document.getElementById('itens-do-carrinho');
    const resumoPedido = document.getElementById('resumo-pedido');
    const totalPedido = document.getElementById('total-pedido');
    const subtotalValor = document.getElementById('subtotal-valor');

    // Limpa o conteúdo antes de adicionar os itens atualizados
    containerItens.innerHTML = '';
    resumoPedido.innerHTML = '';
    let subtotal = 0;

    if (carrinho.length === 0) {
        containerItens.innerHTML = '<p class="text-gray-600 p-4">Seu carrinho está vazio.</p>';
        totalPedido.innerText = 'R$ 0,00';
        subtotalValor.innerText = 'R$ 0,00';
        return;
    }

    // A linha mais importante - note o (item, index)
    carrinho.forEach((item, index) => {
        subtotal += item.preco * item.quantidade;

        containerItens.innerHTML += `
    <div class="cart-item flex items-center p-3 rounded-lg border border-gray-100">
        <div class="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
        </div>
        <div class="flex-grow">
            <h3 class="font-medium">${item.nome}</h3>
            <p class="text-sm text-gray-600">R$ ${item.preco.toFixed(2).replace('.', ',')} / un</p>
        </div>
        <div class="flex items-center">
            <div class="flex items-center mr-6">
                <button class="quantity-btn h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center" onclick="mudarQuantidade(${index}, -1)">-</button>
                <span class="mx-3 w-4 text-center">${item.quantidade}</span>
                <button class="quantity-btn h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center" onclick="mudarQuantidade(${index}, 1)">+</button>
            </div>
            <div class="text-right">
                <div class="font-medium">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</div>
                <button class="text-red-500 text-sm hover:underline" onclick="removerDoCarrinho(${index})">
                    Remover
                </button>
            </div>
        </div>
    </div>
`;
        
        resumoPedido.innerHTML += `
            <div class="flex justify-between text-sm">
                <span>1x ${item.nome}</span>
                <span>R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    });
    
    subtotalValor.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    totalPedido.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

function removerDoCarrinho(index) {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    exibirItensDoCarrinho();
}

function mudarQuantidade(index, mudanca) {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Altera a quantidade do item específico
    if (carrinho[index]) {
        carrinho[index].quantidade += mudanca;
    }

    // Se a quantidade chegar a zero ou menos, remove o item
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1); // Remove o item da lista
    }

    // Salva o carrinho atualizado
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Re-desenha o carrinho para mostrar as mudanças
    exibirItensDoCarrinho();
}