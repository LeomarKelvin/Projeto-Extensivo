export async function fetchDashboardStats() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.error('Token de autenticação não encontrado.');
        window.location.href = '/frontend/Clientes/login.html';
        return null;
    }

    try {
        const response = await fetch('http://localhost:3000/api/dashboard/loja/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao buscar dados do dashboard.');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro na API do dashboard:', error);
        alert(error.message);
        return null;
    }
}