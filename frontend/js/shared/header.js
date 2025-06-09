import { getUser, signOut } from './auth.js';

// HTML para o menu de quem NÃO está logado
const menuDeslogado = `
    <a href="/frontend/Inicio.html" class="text-gray-700 hover:text-blue-600">Início</a>
    <a href="/frontend/Lojas.html" class="text-gray-700 hover:text-blue-600">Lojas</a>
    <a href="/frontend/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Entrar</a>
`;

// HTML para o menu de quem ESTÁ logado
const menuLogado = `
    <a href="/frontend/Inicio.html" class="text-gray-700 hover:text-blue-600">Início</a>
    <a href="/frontend/Lojas.html" class="text-gray-700 hover:text-blue-600">Lojas</a>
    <a href="/frontend/Pedidos.html" class="text-gray-700 hover:text-blue-600">Meus Pedidos</a>
    <a href="/frontend/Carrinho.html" class="text-gray-700 hover:text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    </a>
    <button id="btn-logout" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Sair</button>
`;

/**
 * Função que monta o cabeçalho da página.
 */
async function montarHeader() {
    // 1. Pega o elemento <header> do HTML. É importante que ele exista na página.
    const headerContainer = document.querySelector('header#main-header');
    if (!headerContainer) {
        console.error('Elemento <header id="main-header"> não encontrado!');
        return;
    }
    
    // 2. Cria o contêiner do menu
    const navContainer = document.createElement('nav');
    navContainer.className = 'container mx-auto px-6 py-4 flex justify-between items-center';

    const logo = `<div class="text-2xl font-bold text-gray-800">PedeAí</div>`;
    const menuLinks = document.createElement('div');
    menuLinks.className = 'flex items-center space-x-6';
    
    // 3. Verifica se o usuário está logado
    const user = await getUser();

    // 4. Decide qual menu mostrar
    if (user) {
        menuLinks.innerHTML = menuLogado;
    } else {
        menuLinks.innerHTML = menuDeslogado;
    }

    // 5. Junta as partes e coloca no HTML
    navContainer.innerHTML = logo;
    navContainer.appendChild(menuLinks);
    headerContainer.appendChild(navContainer);

    // 6. Se o usuário estiver logado, adiciona a função de clique no botão "Sair"
    if (user) {
        const logoutButton = document.getElementById('btn-logout');
        if (logoutButton) {
            logoutButton.addEventListener('click', signOut);
        }
    }
}

montarHeader();