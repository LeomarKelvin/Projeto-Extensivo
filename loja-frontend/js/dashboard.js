import { fetchDashboardStats, fetchSalesChartData } from './api/dashboardApi.js';

// Esta variável vai guardar a instância do nosso gráfico para podermos atualizá-la
let salesChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Proteção para garantir que o usuário está logado
    if (!localStorage.getItem('userToken')) {
        window.location.href = '/frontend/Clientes/login.html';
        return;
    }

    // Funções que rodam assim que a página carrega
    carregarEstatisticas();
    carregarGraficoDeVendas('7d');
    configurarBotoesDePeriodo();
    carregarPedidosRecentes();
    carregarTabelaDeProdutos();
    configurarLogout();
});

function configurarLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/frontend/Clientes/login.html';
        });
    }
}

async function carregarEstatisticas() {
    const stats = await fetchDashboardStats();
    if (!stats) return;

    document.getElementById('stats-total-pedidos').textContent = stats.totalPedidos;
    document.getElementById('stats-faturamento').textContent = `R$ ${stats.faturamento.toFixed(2).replace('.', ',')}`;
    document.getElementById('stats-novos-clientes').textContent = stats.novosClientes;

    const avaliacaoContainer = document.getElementById('stats-avaliacao-media');
    if (avaliacaoContainer) {
        const nota = parseFloat(stats.avaliacaoMedia) || 0;
        let estrelasHtml = '';
        for (let i = 1; i <= 5; i++) {
            const cor = i <= nota ? 'text-yellow-400' : 'text-gray-300';
            estrelasHtml += `<svg class="w-5 h-5 ${cor}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
        }
        avaliacaoContainer.innerHTML = `<p class="text-2xl font-bold mr-1">${nota.toFixed(1)}</p><div class="flex">${estrelasHtml}</div>`;
    }
}

function configurarBotoesDePeriodo() {
    const containerBotoes = document.getElementById('periodo-vendas-botoes');
    if (!containerBotoes) return;

    containerBotoes.addEventListener('click', (event) => {
        const target = event.target.closest('.sales-period-btn');
        if (!target) return;

        // Lógica para o efeito visual de "botão ativo"
        containerBotoes.querySelectorAll('.sales-period-btn').forEach(btn => {
            btn.classList.remove('bg-yellow-400', 'text-black');
            btn.classList.add('bg-gray-100', 'hover:bg-gray-200');
        });
        target.classList.add('bg-yellow-400', 'text-black');
        target.classList.remove('bg-gray-100', 'hover:bg-gray-200');

        const period = target.dataset.period;
        carregarGraficoDeVendas(period);
    });
}

async function carregarGraficoDeVendas(period) {
    const chartData = await fetchSalesChartData(period);
    if (!chartData) return;

    const ctx = document.getElementById('salesChart').getContext('2d');

    // Se um gráfico antigo já existe, o destruímos antes de desenhar o novo
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: chartData.data,
                backgroundColor: 'rgba(255, 209, 0, 0.2)',
                borderColor: '#FFD100',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: '#FFD100',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

async function carregarPedidosRecentes() {
    const pedidos = await fetchRecentOrders();
    const container = document.getElementById('pedidos-recentes-container');

    if (!pedidos || !container) return;

    if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum pedido recente encontrado.</p>';
        return;
    }

    container.innerHTML = ''; // Limpa a mensagem "Carregando..."

    pedidos.forEach(pedido => {
        // Para cada pedido, cria o HTML do item da lista
        const pedidoHtml = criarItemPedidoHtml(pedido);
        // Insere o HTML no container
        container.insertAdjacentHTML('beforeend', pedidoHtml);
    });
}

function criarItemPedidoHtml(pedido) {
    const nomeCliente = pedido.cliente ? pedido.cliente.nome_completo : 'Cliente Anônimo';
    const agora = new Date();
    const dataPedido = new Date(pedido.created_at);
    const diffMinutos = Math.round((agora - dataPedido) / (1000 * 60));

    const statusMap = {
        'Pendente': 'text-gray-800 bg-gray-100',
        'Em preparo': 'text-yellow-800 bg-yellow-100',
        'Entregue': 'text-green-800 bg-green-100',
        'Cancelado': 'text-red-800 bg-red-100',
    };

    return `
        <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="font-semibold text-blue-600">#${pedido.id}</span>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${nomeCliente}</p>
                <p class="text-xs text-gray-500">${diffMinutos} min atrás</p>
            </div>
            <div class="text-right">
                <p class="text-sm font-semibold">R$ ${pedido.valor_total.toFixed(2).replace('.', ',')}</p>
                <span class="inline-block px-2 py-1 text-xs rounded-full ${statusMap[pedido.status] || statusMap['Pendente']}">
                    ${pedido.status}
                </span>
            </div>
        </div>
    `;
}

