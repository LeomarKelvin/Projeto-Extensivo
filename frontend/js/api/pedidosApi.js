import { supabase } from '../shared/auth.js'; // Importamos o supabase para pegar o token de login

const API_URL = 'http://localhost:3000/api'; // O endereço do nosso backend

export async function fetchPedidos() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('Nenhum usuário logado para buscar pedidos.');
      return [];
    }

    const token = session.access_token;

    const response = await fetch(`${API_URL}/pedidos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Não foi possível buscar os pedidos.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return [];
  }
}


/**
 * Função para CRIAR um novo pedido no backend.
 * Ela envia os dados do carrinho e o "crachá" (token) do usuário.
 * @param {object} orderData Os dados do pedido, ex: { items, total, loja_id }
 */
export async function createOrder(orderData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        return { error: 'Usuário não autenticado' };
    }

    try {
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Não foi possível criar o pedido.');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        return { error: error.message };
    }
}