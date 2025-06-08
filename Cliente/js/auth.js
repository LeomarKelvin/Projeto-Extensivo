// js/auth.js - Versão 5.0 com Notificação no Carrinho

// Função para pegar a sessão salva no navegador
function getSession() {
    const sessionJSON = localStorage.getItem('supabase.session');
    if (!sessionJSON) {
        return null;
    }
    return JSON.parse(sessionJSON);
}

// Função para pegar os dados do usuário de dentro da sessão
function getUser() {
    const session = getSession();
    return session ? session.user : null;
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('supabase.session');
    window.location.href = 'login.html';
}

// --- FUNÇÃO DO HEADER ATUALIZADA ---
function updateHeader() {
    const user = getUser();
    const userNavigation = document.getElementById('user-navigation');

    if (userNavigation) {
        // Começa a montar o HTML do header
        let headerHTML = `
            <a href="Inicio.html" class="text-white hover:text-primary transition-colors">Início</a>
            <a href="Lojas.html" class="text-white hover:text-primary transition-colors">Lojas</a>
        `;

        if (user) {
            // Se o usuário está LOGADO...
            const userName = user.user_metadata.full_name || 'Usuário';

            // Pega os itens do carrinho no localStorage para contar
            const cartItems = JSON.parse(localStorage.getItem('carrinho')) || [];
            const cartItemCount = cartItems.reduce((total, item) => total + item.quantidade, 0); // Conta quantos tipos de item tem

            headerHTML += `
                <a href="Pedidos.html" class="text-white hover:text-primary transition-colors">Meus Pedidos</a>
                <a href="Perfil.html" class="font-medium text-primary hover:text-white">Olá, ${userName.split(' ')[0]}</a>
            `;

            // Adiciona o botão do carrinho COM a lógica do círculo amarelo
            headerHTML += `
                <a href="Carrinho.html" class="relative text-white p-2 rounded-full hover:bg-gray-700">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    
                    ${cartItemCount > 0 ? `
                    <span class="absolute -top-1 -right-1 bg-primary text-secondary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        ${cartItemCount}
                    </span>
                    ` : ''}
                </a>
            `;

            headerHTML += `<button onclick="logout()" class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium">Sair</button>`;

        } else {
            // Se o usuário está DESLOGADO...
            headerHTML += `
                 <a href="login.html" class="bg-primary text-secondary font-medium py-2 px-4 rounded-full">Entrar</a>
            `;
        }

        // Insere o HTML final no container
        userNavigation.innerHTML = headerHTML;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateHeader();
    const showLoginToast = localStorage.getItem('showLoginSuccessToast');
    if (showLoginToast === 'true') {
        showToast('Login Efetuado!', 'Seja bem-vindo(a) de volta!');
        localStorage.removeItem('showLoginSuccessToast');
    }
});