import { supabase } from '../../frontend/js/shared/auth.js';

const API_URL = 'http://localhost:3000/api/loja-dashboard';

export async function fetchPedidosDaLoja() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${API_URL}/pedidos`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    if (!response.ok) {
        console.error('Falha ao buscar pedidos da loja');
        return [];
    }
    return await response.json();
}

export async function updatePedidoStatus(pedido_id, novo_status) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${API_URL}/pedidos/update-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ pedido_id, novo_status })
    });
    
    return await response.json();
}