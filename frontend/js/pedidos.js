// frontend/js/pedidos.js

import { fetchPedidos } from './api/pedidosApi.js';

// Função que define a cor e o ícone do status do pedido
function getStatusInfo(status) {
    switch (status) {
        case 'Entregue':
            return {
                badgeClass: 'status-delivered',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
            };
        case 'Em processamento':
            return {
                badgeClass: 'status-processing',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M4 12a8 8 0 018-8v0a8 8 0 018 8v0a8 8 0 01-8 8h-4m-4 0H4m0 0v5h5"></path></svg>`
            };
        case 'Cancelado':
            return {
                badgeClass: 'status-canceled',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
            };
        default: // Pendente ou outros status
            return {
                badgeClass: 'status-pending',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            };
    }
}

// Função que cria o HTML para um único card de pedido, USANDO O SEU DESIGN
function criarCardPedido(pedido) {
    const dataPedido = new Date(pedido.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const { badgeClass, icon } = getStatusInfo(pedido.status || 'Pendente');

    // Supondo que você terá uma forma de buscar o nome e a imagem da loja
    const nomeLoja = "Nome da Loja"; // Substituir com dados reais no futuro
    const imagemLoja = "https://placehold.co/100x100"; // Substituir com dados reais no futuro

    return `
    <div class="order-card bg-white rounded-xl shadow-md p-6 fade-in cursor-pointer">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center">
                <img src="${imagemLoja}" alt="Logo da ${nomeLoja}" class="store-logo mr-4">
                <div>
                    <h2 class="font-bold text-lg text-gray-800">${nomeLoja}</h2>
                    <p class="text-sm text-gray-500">Pedido #${pedido.id}</p>
                </div>
            </div>

            <div class="flex-grow flex items-center justify-between md:justify-start space-x-4">
                 <div>
                    <p class="text-sm text-gray-500">Data</p>
                    <p class="font-medium text-gray-800">${dataPedido}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Total</p>
                    <p class="font-medium text-gray-800">R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
                </div>
                 <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <span class="status-badge ${badgeClass} flex items-center">
                        ${icon}
                        ${pedido.status || 'Pendente'}
                    </span>
                </div>
            </div>

            <div class="flex gap-3 mt-4 md:mt-0">
                <button class="btn-primary flex-1 md:flex-none px-4 py-2 rounded-lg font-medium text-sm">
                    Ver Detalhes
                </button>
                <button class="btn-outline flex-1 md:flex-none px-4 py-2 rounded-lg font-medium text-sm">
                    Ajuda
                </button>
            </div>
        </div>
    </div>
  `;
}

// Função principal que carrega e exibe os pedidos
async function carregarPedidos() {
    const container = document.getElementById('pedidos-container');
    if (!container) {
        console.error('O elemento com ID "pedidos-container" não foi encontrado no seu HTML.');
        return;
    }

    container.innerHTML = '<p class="text-center text-gray-500">Buscando seus pedidos...</p>';

    const pedidos = await fetchPedidos();

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h2 class="mt-2 text-xl font-medium text-gray-800">Nenhum pedido encontrado</h2>
                <p class="mt-1 text-gray-500">Parece que você ainda não fez nenhum pedido. Que tal explorar algumas lojas?</p>
                <button class="btn-primary mt-6 px-6 py-2 rounded-lg font-medium" onclick="window.location.href='/frontend/Lojas.html'">
                    Ver Lojas
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Limpa a mensagem de "buscando"
    pedidos.forEach(pedido => {
        const cardHtml = criarCardPedido(pedido);
        container.innerHTML += cardHtml;
    });
}

// Inicia o processo quando a página é carregada
document.addEventListener('DOMContentLoaded', carregarPedidos);