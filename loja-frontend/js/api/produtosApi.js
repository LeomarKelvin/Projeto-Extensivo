import { getAuthToken } from '../shared/auth.js';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Adiciona um novo produto enviando os dados para a API.
 * @param {FormData} productFormData - Os dados do produto em um FormData object.
 * @returns {Promise<Object>} - O resultado da API.
 */
export const addProduct = async (productFormData) => {
    const authToken = getAuthToken();
    if (!authToken) {
        console.error('Token de autenticação não encontrado.');
        alert('Erro de autenticação. Faça o login novamente.');
        return { error: { message: 'Acesso não autorizado.' } };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/produtos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Nota: Não defina 'Content-Type' ao usar FormData, o navegador faz isso.
            },
            body: productFormData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Falha ao adicionar o produto.');
        }

        return result;
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        return { error };
    }
};

// Futuramente, adicionaremos aqui as funções para carregar, editar e deletar produtos.