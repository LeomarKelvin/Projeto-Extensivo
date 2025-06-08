document.addEventListener('DOMContentLoaded', function() {
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleFinalizarPedido);
    }
    exibirItensDoCarrinho();
});

async function handleCheckout() {
    const user = getUser();
    if (!user) {
        return showToast('Erro', 'Você precisa estar logado para finalizar um pedido.', 'error');
    }
    const cartItems = JSON.parse(localStorage.getItem('carrinho')) || [];
    if (cartItems.length === 0) {
        return showToast('Atenção', 'Seu carrinho está vazio.', 'error');
    }
    const totalPrice = cartItems.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    const orderData = {
        user_id: user.id,
        loja_id: cartItems[0].lojaId,
        total_price: totalPrice,
        items: cartItems
    };
    try {
        const response = await fetch('http://localhost:3000/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const result = await response.json();
        if (response.ok) {
            showToast('Sucesso!', 'Seu pedido foi realizado com sucesso!');
            localStorage.removeItem('carrinho');
            updateHeader();
            setTimeout(() => { window.location.href = 'Pedidos.html'; }, 2000);
        } else {
            showToast('Erro', result.error, 'error');
        }
    } catch (error) {
        showToast('Erro de Conexão', 'Não foi possível conectar ao servidor.', 'error');
    }
}

function exibirItensDoCarrinho() {
    const containerItens = document.getElementById('itens-do-carrinho');
    const resumoPedido = document.getElementById('resumo-pedido');
    const totalPedido = document.getElementById('total-pedido');
    const subtotalValor = document.getElementById('subtotal-valor');

    if (!containerItens || !resumoPedido || !totalPedido) return;

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    containerItens.innerHTML = '';
    resumoPedido.innerHTML = '';
    let subtotal = 0;

    if (carrinho.length === 0) {
        containerItens.innerHTML = '<p class="text-gray-600 p-4">Seu carrinho está vazio.</p>';
        totalPedido.innerText = 'R$ 0,00';
        if (subtotalValor) subtotalValor.innerText = 'R$ 0,00';
        updateHeader(); // Atualiza o header se o carrinho ficar vazio
        return;
    }

    carrinho.forEach((item, index) => {
        subtotal += item.preco * item.quantidade;

        // O Molde HTML para cada item no carrinho
        containerItens.innerHTML += `
            <div class="flex items-center justify-between p-4 border-b border-gray-200">
                <div class="flex items-center">
                    <img src="https://placehold.co/60" alt="${item.nome}" class="w-16 h-16 rounded-lg mr-4 object-cover">
                    <div>
                        <h3 class="font-medium text-gray-800">${item.nome}</h3>
                        <p class="text-sm text-gray-500">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center border border-gray-300 rounded-lg">
                        <button class="px-3 py-1 text-lg" onclick="mudarQuantidade(${index}, -1)">-</button>
                        <span class="px-3">${item.quantidade}</span>
                        <button class="px-3 py-1 text-lg" onclick="mudarQuantidade(${index}, 1)">+</button>
                    </div>
                    <p class="font-semibold w-20 text-right">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
                    <button class="text-gray-400 hover:text-red-500" onclick="removerDoCarrinho(${index})">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        `;

        // O Molde para o resumo
        resumoPedido.innerHTML += `
            <div class="flex justify-between text-sm text-gray-600">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    });

    totalPedido.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (subtotalValor) subtotalValor.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    updateHeader();
}

function removerDoCarrinho(index) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    exibirItensDoCarrinho();
    updateHeader();
}

function mudarQuantidade(index, mudanca) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    if (carrinho[index]) {
        carrinho[index].quantidade += mudanca;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
    }
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    exibirItensDoCarrinho();
    updateHeader();
}