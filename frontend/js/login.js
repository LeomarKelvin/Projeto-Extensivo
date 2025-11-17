document.addEventListener('DOMContentLoaded', function () {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const userTypeButton = document.getElementById('user-type');
    const storeTypeButton = document.getElementById('store-type');
    const deliveryTypeButton = document.getElementById('delivery-type');

    const storeFields = document.getElementById('store-fields');
    const deliveryFields = document.getElementById('delivery-fields');

    // Esta variável irá guardar o tipo de conta selecionado
    let selectedAccountType = 'cliente';

    function setupEventListeners() {
        if (loginTab) loginTab.addEventListener('click', () => switchTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => switchTab('register'));

        // Eventos para selecionar o tipo de conta
        if (userTypeButton) userTypeButton.addEventListener('click', () => selectAccountType('cliente'));
        if (storeTypeButton) storeTypeButton.addEventListener('click', () => selectAccountType('loja'));
        if (deliveryTypeButton) deliveryTypeButton.addEventListener('click', () => selectAccountType('entregador'));

        if (loginForm) {
            loginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                handleLogin();
            });
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (event) => {
                event.preventDefault();
                handleRegister();
            });
        }
    }

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
        // Atualiza a variável global com o tipo de conta
        selectedAccountType = type;

        // Lógica visual para destacar o botão selecionado
        userTypeButton.classList.remove('account-type-selected');
        storeTypeButton.classList.remove('account-type-selected');
        deliveryTypeButton.classList.remove('account-type-selected');

        storeFields.classList.add('hidden');
        deliveryFields.classList.add('hidden');

        if (type === 'cliente') {
            userTypeButton.classList.add('account-type-selected');
        } else if (type === 'loja') {
            storeTypeButton.classList.add('account-type-selected');
            storeFields.classList.remove('hidden');
        } else if (type === 'entregador') {
            deliveryTypeButton.classList.add('account-type-selected');
            deliveryFields.classList.remove('hidden');
        }
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) return showToast('Atenção', 'Por favor, preencha e-mail e senha.', 'error');

        try {
            const response = await fetch(`${window.location.origin}/api/perfil/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('userToken', result.session.access_token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                localStorage.setItem('userProfile', JSON.stringify(result.perfil));
                showToast('Sucesso!', 'Login realizado com sucesso!');
                setTimeout(() => {
                    if (result.perfil.tipo === 'loja') {
                        window.location.href = '../../loja-frontend/Dashboard.html';
                    } else {
                        window.location.href = '/frontend/Clientes/Inicio.html';
                    }
                }, 1500);
            } else {
                showToast('Erro no login', result.error, 'error');
            }
        } catch (error) {
            showToast('Erro de Conexão', 'Não foi possível conectar com o servidor.', 'error');
        }
    }

    async function handleRegister() {
        const nome = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (!nome || !email || !password) return showToast('Atenção', 'Por favor, preencha nome, e-mail e senha.', 'error');
        if (password !== passwordConfirm) return showToast('Atenção', 'As senhas não coincidem.', 'error');

        const dataToSend = {
            nome: nome,
            email: email,
            password: password,
            tipo: selectedAccountType // Envia o tipo correto
        };

        if (selectedAccountType === 'loja') {
            const nomeLoja = document.getElementById('store-name').value;
            if (!nomeLoja) return showToast('Atenção', 'O nome da loja é obrigatório.', 'error');
            dataToSend.nome_loja = nomeLoja;
        }

        try {
            const response = await fetch(`${window.location.origin}/api/perfil/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();
            if (response.ok) {
                showToast('Sucesso!', 'Cadastro realizado! Você já pode fazer o login.');
                setTimeout(() => switchTab('login'), 2000);
            } else {
                showToast('Erro no cadastro', result.error, 'error');
            }
        } catch (error) {
            showToast('Erro de Conexão', 'Não foi possível conectar com o servidor.', 'error');
        }
    }

    setupEventListeners();
    // Garante que o estado inicial seja 'cliente'
    selectAccountType('cliente');
    switchTab('login');
});

// A função showToast permanece a mesma