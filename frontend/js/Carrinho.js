// frontend/js/Carrinho.js

// Importa as funções do nosso novo serviço de carrinho
import { getCart, removeItemFromCart, updateItemQuantity, getSubtotal, clearCart } from './services/cartService.js';
// Importa a função para criar o pedido na API
import { createOrder } from './api/pedidosApi.js'; 

function renderizarItensCarrinho() {
    // ... toda a sua função renderizarItensCarrinho continua exatamente igual ...
    const cart = getCart();
    const container = document.getElementById('itens-do-carrinho');
    const resumoContainer = document.getElementById('resumo-pedido');
    const subtotalEl = document.getElementById('subtotal-valor');
    const totalEl = document.getElementById('total-pedido');

    if (!container || !resumoContainer || !subtotalEl || !totalEl) {
        console.error('Um ou mais elementos do carrinho não foram encontrados no HTML.');
        return;
    }

    container.innerHTML = '';
    resumoContainer.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Seu carrinho está vazio.</p>';
        subtotalEl.textContent = 'R$ 0,00';
        totalEl.textContent = 'R$ 0,00';
        return;
    }

    cart.forEach(item => {
        const itemHtml = `
            <div class="cart-item flex items-center justify-between p-4 border-b border-gray-100">
                <div class="flex items-center">
                    <img src="${item.imagem || 'https://placehold.co/80x80'}" alt="${item.nome}" class="w-16 h-16 rounded-lg object-cover mr-4">
                    <div>
                        <h3 class="font-medium text-gray-800">${item.nome}</h3>
                        <p class="text-sm text-gray-500">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center border border-gray-300 rounded-lg">
                        <button class="quantity-btn p-2" data-item-id="${item.id}" data-change="-1">-</button>
                        <span class="px-3 text-center">${item.quantidade}</span>
                        <button class="quantity-btn p-2" data-item-id="${item.id}" data-change="1">+</button>
                    </div>
                    <p class="font-semibold w-20 text-right">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
                    <button class="text-gray-400 hover:text-red-500 p-2 remove-btn" data-item-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;

        const resumoHtml = `
            <div class="flex justify-between text-sm">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        resumoContainer.innerHTML += resumoHtml;
    });

    const subtotal = getSubtotal();
    subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    totalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

    adicionarEventos();
}

function adicionarEventos() {
    // ... sua função adicionarEventos continua igual ...
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.itemId;
            const change = parseInt(button.dataset.change);
            const cart = getCart();
            const item = cart.find(i => i.id === itemId);
            if (item) {
                const novaQuantidade = item.quantidade + change;
                updateItemQuantity(itemId, novaQuantidade);
                renderizarItensCarrinho();
            }
        });
    });

    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.itemId;
            if (confirm('Tem certeza que deseja remover este item?')) {
                removeItemFromCart(itemId);
                renderizarItensCarrinho();
            }
        });
    });
}


async function finalizarPedido() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        return;
    }
    
    // Supondo que todos os itens do carrinho são da mesma loja
    // Em um app real, você precisaria de uma lógica mais robusta aqui
    const loja_id = cart[0].loja_id; 
    const total = getSubtotal();

    const orderData = {
        items: cart,
        total: total,
        loja_id: loja_id
    };

    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processando...';
    
    const result = await createOrder(orderData);

    if (result && !result.error) {
        clearCart();
        alert('Pedido realizado com sucesso!');
        window.location.href = '/frontend/Pedidos.html';
    } else {
        alert('Houve um erro ao finalizar seu pedido. Por favor, tente novamente.');
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Finalizar Pedido';
    }
}


// Função principal que é executada quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    renderizarItensCarrinho();

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', finalizarPedido);
    }
});