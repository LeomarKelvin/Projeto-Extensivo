import { fetchDashboardStats } from './api/dashboardApi.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('userToken')) {
        window.location.href = '/frontend/Clientes/login.html';
        return;
    }
    carregarEstatisticas();
});

async function carregarEstatisticas() {
    const stats = await fetchDashboardStats();
    if (!stats) return;

    document.getElementById('stats-total-pedidos').textContent = stats.totalPedidos;
    document.getElementById('stats-faturamento').textContent = `R$ ${stats.faturamento.toFixed(2).replace('.', ',')}`;
    document.getElementById('stats-novos-clientes').textContent = stats.novosClientes;

    const avaliacaoContainer = document.getElementById('stats-avaliacao-container');
    if (avaliacaoContainer) {
        const nota = parseFloat(stats.avaliacaoMedia) || 0;
        avaliacaoContainer.querySelector('p').textContent = nota.toFixed(1);
    }
}