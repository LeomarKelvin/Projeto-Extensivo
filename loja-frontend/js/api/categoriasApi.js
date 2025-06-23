import { getAuthToken } from '../shared/auth.js';

const API_BASE_URL = 'http://localhost:3000/api/dashboard';

async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
    }
    return response.json();
}

export const getCategories = () => {
    return fetchWithAuth(`${API_BASE_URL}/categorias`);
};

export const addCategory = (nome_categoria) => {
    return fetchWithAuth(`${API_BASE_URL}/categorias`, {
        method: 'POST',
        body: JSON.stringify({ nome_categoria }),
    });
};

export const deleteCategory = (categoryId) => {
    return fetchWithAuth(`${API_BASE_URL}/categorias/${categoryId}`, {
        method: 'DELETE',
    });
};