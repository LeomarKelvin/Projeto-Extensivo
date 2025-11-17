// A função de montar o header agora é global, pode ser chamada de qualquer lugar.
function montarHeader() {
    const headerElement = document.querySelector('header');
    if (!headerElement) {
        return;
    }
    headerElement.id = 'main-header';
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (userData) {
        renderHeaderLogado(headerElement, userData);
    } else {
        renderHeaderDeslogado(headerElement);
    }
}

// O restante do seu arquivo header.js continua exatamente igual...

function getCart() {
    const cartJson = localStorage.getItem('pedeai_cart');
    return cartJson ? JSON.parse(cartJson) : [];
}

function renderHeaderDeslogado(headerElement) {
    headerElement.className = 'bg-gray-900 text-white p-4 shadow-md z-50 relative';
    headerElement.innerHTML = `
        <div class="container mx-auto px-4 flex justify-between items-center">
            <a href="/frontend/Clientes/Inicio.html" class="flex items-center">
                <svg class="h-10 w-10 lightning-logo" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFD100"></circle><circle cx="12" cy="12" r="9" fill="#1A1A1A"></circle><path d="M13 6L7 14h4v4l6-8h-4V6z" fill="#FFD100"></path></svg>
                <span class="ml-2 text-2xl font-bold text-primary">PedeAí</span>
            </a>
            <div id="user-navigation" class="flex items-center space-x-4">
                <a href="/frontend/Clientes/Inicio.html" class="text-white hover:text-primary transition-colors">Início</a>
                <a href="/frontend/Clientes/Lojas.html" class="text-white hover:text-primary transition-colors">Lojas</a>
                <a href="/frontend/Clientes/login.html" class="bg-primary text-secondary font-medium py-2 px-4 rounded-full">Entrar</a>
            </div>
        </div>
    `;
}

function renderHeaderLogado(headerElement, userData) {
    const primeiroNome = userData.nome_completo ? userData.nome_completo.split(' ')[0] : userData.email.split('@')[0];
    const cart = getCart();
    const cartItemCount = cart.reduce((total, item) => total + item.quantidade, 0);

    headerElement.className = 'bg-secondary shadow-md sticky top-0 z-50';
    headerElement.innerHTML = `
        <div class="container mx-auto px-4 py-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <div class="mr-2">
                        <svg class="h-10 w-10 lightning-logo" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFD100"></circle><circle cx="12" cy="12" r="9" fill="#1A1A1A"></circle><path d="M13 6L7 14h4v4l6-8h-4V6z" fill="#FFD100"></path></svg>
                    </div>
                    <h1 class="text-2xl font-bold text-white">Pede<span class="text-primary">Aí</span></h1>
                </div>
                <div id="user-navigation" class="flex items-center space-x-4">
                    <a href="/frontend/Clientes/Inicio.html" class="text-white hover:text-primary transition-colors">Início</a>
                    <a href="/frontend/Clientes/Lojas.html" class="text-white hover:text-primary transition-colors">Lojas</a>
                    <a href="/frontend/Clientes/Pedidos.html" class="text-white hover:text-primary transition-colors">Meus Pedidos</a>
                    <a href="/frontend/Clientes/Perfil.html" class="font-medium text-primary hover:text-white">Olá, ${primeiroNome}</a>
                    <a href="/frontend/Clientes/Carrinho.html" class="relative text-white p-2 rounded-full hover:bg-gray-700">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        ${cartItemCount > 0 ? `
                        <span class="absolute -top-1 -right-1 bg-primary text-secondary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            ${cartItemCount}
                        </span>
                        ` : ''}
                    </a>
                    <button id="logout-button" class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium">Sair</button>
                </div>
            </div>
        </div>
    `;

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('pedeai_cart'); 
            window.location.href = '/frontend/Clientes/login.html';
        });
    }
}

// Apenas chamamos a função quando a página carregar
document.addEventListener('DOMContentLoaded', montarHeader);