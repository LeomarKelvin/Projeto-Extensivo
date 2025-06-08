document.addEventListener('DOMContentLoaded', function () {

    // Pega todos os elementos que precisamos da página
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const userTypeButton = document.getElementById('user-type');
    const storeTypeButton = document.getElementById('store-type');
    const deliveryTypeButton = document.getElementById('delivery-type');

    const storeFields = document.getElementById('store-fields');
    const deliveryFields = document.getElementById('delivery-fields');

    const loginButton = document.querySelector('#login-form button.btn-primary');
    const registerButton = document.querySelector('#register-form button.btn-primary');

    let selectedAccountType = 'user'; // Guarda o tipo de conta selecionado

    // --- Adiciona os Eventos de Clique ---

    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    userTypeButton.addEventListener('click', () => selectAccountType('user'));
    storeTypeButton.addEventListener('click', () => selectAccountType('store'));
    deliveryTypeButton.addEventListener('click', () => selectAccountType('delivery'));

    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleLogin();
        });
    }
    if (registerButton) {
        registerButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleRegister();
        });
    }

    // --- Funções ---

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

    function selectAccountType(type) {
        selectedAccountType = type;
        userTypeButton.classList.remove('account-type-selected');
        storeTypeButton.classList.remove('account-type-selected');
        deliveryTypeButton.classList.remove('account-type-selected');
        storeFields.classList.add('hidden');
        deliveryFields.classList.add('hidden');

        if (type === 'user') {
            userTypeButton.classList.add('account-type-selected');
        } else if (type === 'store') {
            storeTypeButton.classList.add('account-type-selected');
            storeFields.classList.remove('hidden');
        } else if (type === 'delivery') {
            deliveryTypeButton.classList.add('account-type-selected');
            deliveryFields.classList.remove('hidden');
        }
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) { return showToast('Atenção', 'Por favor, preencha e-mail e senha.', 'error'); }
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('supabase.session', JSON.stringify(result.data.session));
                localStorage.setItem('showLoginSuccessToast', 'true');
                window.location.href = 'Inicio.html';
            } else {
                showToast('Erro no login', result.error, 'error');
            }
        } catch (error) {
            showToast('Erro de Conexão', 'Não foi possível conectar com o servidor.', 'error');
        }
    }

    async function handleRegister() {
        // Pega os campos comuns
        const nome = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (!nome || !email || !password) { return showToast('Atenção', 'Por favor, preencha nome, e-mail e senha.', 'error'); }
        if (password !== passwordConfirm) { return showToast('Atenção', 'As senhas não coincidem.', 'error'); }

        // Prepara os dados para enviar
        const dataToSend = {
            nome: nome,
            email: email,
            password: password,
            role: selectedAccountType
        };

        // Se for uma loja, adiciona os dados da loja
        if (selectedAccountType === 'store') {
            dataToSend.store_name = document.getElementById('store-name').value;
            dataToSend.store_category = document.getElementById('store-category').value;
            if (!dataToSend.store_name || !dataToSend.store_category) {
                return showToast('Atenção', 'Preencha o nome e a categoria da loja.', 'error');
            }
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend), // Envia todos os dados
            });
            const result = await response.json();
            if (response.ok) {
                showToast('Sucesso!', result.message);
                setTimeout(() => window.location.reload(), 3000);
            } else {
                showToast('Erro no cadastro', result.error, 'error');
            }
        } catch (error) {
            showToast('Erro de Conexão', 'Não foi possível conectar com o servidor.', 'error');
        }
    }

    // Inicia a página com as seleções padrão
    switchTab('login');
    selectAccountType('user');
});