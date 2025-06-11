// Função auxiliar para lidar com erros de autenticação
function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = '/frontend/Clientes/login.html';
        return true;
    }
    return false;
}

// Função para buscar os dados dos CARDS
export async function fetchDashboardStats() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/frontend/Clientes/login.html';
        return null;
    }
    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (handleAuthError(response)) return null;
        if (!response.ok) throw new Error((await response.json()).error);
        return await response.json();
    } catch (error) {
        console.error('Erro na API de stats:', error);
        return null;
    }
}

// Função para buscar os dados do GRÁFICO
export async function fetchSalesChartData(period = '7d') {
    const token = localStorage.getItem('userToken');
    if (!token) return null;
    try {
        const response = await fetch(`http://localhost:3000/api/dashboard/loja/vendas?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (handleAuthError(response)) return null;
        if (!response.ok) throw new Error((await response.json()).error);
        return await response.json();
    } catch (error) {
        console.error('Erro na API do gráfico:', error);
        return null;
    }
}

// Função para buscar os PEDIDOS RECENTES
export async function fetchRecentOrders() {
    const token = localStorage.getItem('userToken');
    if (!token) return null;
    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/pedidos-recentes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (handleAuthError(response)) return null;
        if (!response.ok) throw new Error((await response.json()).error);
        return await response.json();
    } catch (error) {
        console.error('Erro na API de pedidos recentes:', error);
        return null;
    }
}

// Função para buscar os PRODUTOS DA LOJA
export async function fetchProdutosDaLoja() {
    const token = localStorage.getItem('userToken');
    if (!token) return null;
    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/produtos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (handleAuthError(response)) return null;
        if (!response.ok) throw new Error((await response.json()).error);
        return await response.json();
    } catch (error) {
        console.error('Erro na API de produtos:', error);
        return null;
    }
}