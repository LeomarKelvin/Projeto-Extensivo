document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos das Abas
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Botões de Tipo de Conta
    const userTypeButton = document.getElementById('user-type');
    const storeTypeButton = document.getElementById('store-type');
    const deliveryTypeButton = document.getElementById('delivery-type');

    // Campos Específicos dos Formulários
    const storeFields = document.getElementById('store-fields');
    const deliveryFields = document.getElementById('delivery-fields');
    
    // --- EVENTOS DE CLIQUE ---
    
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    userTypeButton.addEventListener('click', () => selectAccountType('user'));
    storeTypeButton.addEventListener('click', () => selectAccountType('store'));
    deliveryTypeButton.addEventListener('click', () => selectAccountType('delivery'));

    // --- FUNÇÕES ---

    // Função para trocar entre as abas de Login e Cadastro
    function switchTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('tab-active');
            registerTab.classList.remove('tab-active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerTab.classList.add('tab-active');
            loginTab.classList.remove('tab-active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    // Função ATUALIZADA para selecionar o tipo de conta e mostrar os campos corretos
    function selectAccountType(type) {
        // Remove a classe de "selecionado" de todos os botões
        userTypeButton.classList.remove('account-type-selected');
        storeTypeButton.classList.remove('account-type-selected');
        deliveryTypeButton.classList.remove('account-type-selected');

        // Esconde os dois conjuntos de campos específicos
        storeFields.classList.add('hidden');
        deliveryFields.classList.add('hidden');
        
        // Adiciona a seleção e mostra os campos corretos para o tipo que foi clicado
        if (type === 'user') {
            userTypeButton.classList.add('account-type-selected');
        } else if (type === 'store') {
            storeTypeButton.classList.add('account-type-selected');
            storeFields.classList.remove('hidden'); // Mostra os campos da loja
        } else if (type === 'delivery') {
            deliveryTypeButton.classList.add('account-type-selected');
            deliveryFields.classList.remove('hidden'); // Mostra os campos do entregador
        }
    }

    // Garante que a aba "Entrar" e o tipo "Cliente" comecem selecionados por padrão
    switchTab('login');
    selectAccountType('user');
});