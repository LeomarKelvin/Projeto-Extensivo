const API_BASE_URL = 'http://localhost:3000/api';

async function registerUser(email, password, role, additionalData = {}) {
    try {
        // Rota de cadastro correta
        const response = await fetch(`${API_BASE_URL}/perfil/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role, ...additionalData }),
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        // A correção está aqui: a URL agora aponta para /perfil/login
        const response = await fetch(`${API_BASE_URL}/perfil/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'Erro ao fazer login.');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro de Conexão:', error);
        throw new Error('Não foi possível conectar com o servidor.');
    }
}

async function fetchUserProfile() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/perfil`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
    }
}

async function updateUserProfile(updates) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
}