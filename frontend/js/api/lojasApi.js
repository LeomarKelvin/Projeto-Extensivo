// frontend/js/api/pedidosApi.js

import { supabase } from '../shared/auth.js'; // Importamos o supabase para pegar o token

const API_URL = 'http://localhost:3000/api';

export async function fetchPedidos() {
  try {
    // Pegamos a sessão atual para obter o token de acesso (nosso crachá)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('Nenhum usuário logado para buscar pedidos.');
      return []; // Retorna vazio se não há ninguém logado
    }

    const token = session.access_token;

    const response = await fetch(`${API_URL}/pedidos`, {
      headers: {
        // Enviamos o crachá no cabeçalho da requisição
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
    return []; // Retorna um array vazio em caso de erro
  }
}