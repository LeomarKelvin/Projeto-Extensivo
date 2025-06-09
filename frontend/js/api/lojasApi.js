const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Busca a lista de todas as lojas cadastradas no backend.
 */
export async function getLojas() {
    try {
        const response = await fetch(`${API_BASE_URL}/lojas`);
        if (!response.ok) {
            throw new Error('A resposta da rede não foi boa.');
        }
        return await response.json();
    } catch (error) {
        console.error('Houve um problema ao buscar as lojas:', error);
        return []; // Retorna uma lista vazia para não quebrar a página.
    }
}