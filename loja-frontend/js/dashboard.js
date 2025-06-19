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
    carregarProdutosMaisVendidos();
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
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.error('Token não encontrado.');
        return;
    }

    const container = document.getElementById('recent-orders-container');
    if (!container) {
        console.error('Container de pedidos recentes não encontrado.');
        return;
    }

    const nomeCliente = pedido.perfis ? pedido.perfis.nome_completo : 'Cliente Anônimo';

    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/pedidos-recentes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Falha ao buscar os pedidos do servidor.');
        }

        const pedidos = await response.json();
        container.innerHTML = ''; // Limpa a mensagem "Carregando..."

        if (pedidos.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 p-4">Nenhum pedido recente encontrado.</p>';
            return;
        }

        const statusMap = {
            'Pendente': 'text-gray-800 bg-gray-100',
            'Confirmado': 'text-cyan-800 bg-cyan-100',
            'Em preparo': 'text-yellow-800 bg-yellow-100',
            'A caminho': 'text-blue-800 bg-blue-100',
            'Entregue': 'text-green-800 bg-green-100',
            'Cancelado': 'text-red-800 bg-red-100',
        };

        pedidos.forEach((pedido, index) => {
            const agora = new Date();
            const dataPedido = new Date(pedido.created_at);
            const diffMinutos = Math.round((agora - dataPedido) / (1000 * 60));

            let tempoAtras = `${diffMinutos} min atrás`;
            if (diffMinutos >= 60) {
                const diffHoras = Math.floor(diffMinutos / 60);
                tempoAtras = `${diffHoras}h atrás`;
            }

            tr.innerHTML = `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="font-semibold text-blue-600">#${index + 1}</span>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">Cliente ID: ${pedido.cliente_id.substring(0, 8)}...</p>
                    <p class="text-xs text-gray-500">Pedido #${pedido.id.substring(0, 6)}... • ${tempoAtras}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold">${pedido.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <span class="inline-block px-2 py-1 text-xs rounded-full ${statusMap[pedido.status] || statusMap['Pendente']}">
                        ${pedido.status}
                    </span>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${nomeCliente}</p>
                    <p class="text-xs text-gray-500">Pedido #${pedido.id.substring(0, 6)}... • ${tempoAtras}</p>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });

    } catch (error) {
        console.error('Erro ao carregar pedidos recentes:', error.message);
        container.innerHTML = '<p class="text-center text-red-500 p-4">Erro ao carregar os pedidos.</p>';
    }
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

async function carregarTabelaDeProdutos() {
    const token = localStorage.getItem('userToken');
    const tbody = document.getElementById('produtos-tbody');

    if (!tbody) {
        console.error('Elemento #produtos-tbody não encontrado.');
        return;
    }

    // Exibe uma mensagem de carregamento
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Carregando produtos...</td></tr>';

    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/produtos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Falha ao buscar produtos do servidor.');
        }

        const produtos = await response.json();
        tbody.innerHTML = ''; // Limpa a mensagem de carregamento

        if (produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        produtos.forEach(produto => {
            const tr = document.createElement('tr');

            const statusClass = produto.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const statusText = produto.disponivel ? 'Disponível' : 'Indisponível';
            const precoFormatado = produto.preco ? `R$ ${produto.preco.toFixed(2).replace('.', ',')}` : 'Não definido';

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full object-cover" src="${produto.imagem_url || 'https://via.placeholder.com/150'}" alt="${produto.nome}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${produto.nome}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${precoFormatado}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" class="text-yellow-600 hover:text-yellow-900">Editar</a>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Erro ao carregar produtos.</td></tr>';
    }
}

async function carregarProdutosMaisVendidos() {
    const token = localStorage.getItem('userToken');
    const container = document.getElementById('produtos-mais-vendidos-container');
    if (!container) return;

    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/produtos-mais-vendidos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar dados do servidor.');

        const produtos = await response.json();
        container.innerHTML = ''; 

        if (produtos.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 text-center">Ainda não há dados de vendas.</p>';
            return;
        }
        
        const maxVendas = Math.max(...produtos.map(p => p.total_vendido));

        produtos.forEach((produto, index) => {
            const progresso = maxVendas > 0 ? (produto.total_vendido / maxVendas) * 100 : 0;
            const itemHtml = `
                <div class="flex items-center">
                    <div class="h-10 w-10 rounded-md bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        <span class="font-semibold text-gray-600">${index + 1}</span>
                    </div>
                    <div class="ml-3 flex-1">
                        <div class="flex justify-between">
                            <p class="text-sm font-medium">${produto.nome_produto}</p>
                            <p class="text-sm font-semibold">${produto.total_vendido} vendas</p>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div class="bg-yellow-400 h-2 rounded-full" style="width: ${progresso}%"></div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += itemHtml;
        });

    } catch (error) {
        console.error('Erro ao carregar produtos mais vendidos:', error);
        container.innerHTML = '<p class="text-sm text-red-500 text-center">Não foi possível carregar os dados.</p>';
    }
}