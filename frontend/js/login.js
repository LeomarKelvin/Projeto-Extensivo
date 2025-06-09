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

    const loginButton = document.querySelector('#login-form button');
    const registerButton = document.querySelector('#register-form button');

    let selectedAccountType = 'user'; 

    // --- Adiciona os Eventos de Clique ---

    if(loginTab) loginTab.addEventListener('click', () => switchTab('login'));
    if(registerTab) registerTab.addEventListener('click', () => switchTab('register'));

    if(userTypeButton) userTypeButton.addEventListener('click', () => selectAccountType('user'));
    if(storeTypeButton) storeTypeButton.addEventListener('click', () => selectAccountType('store'));
    if(deliveryTypeButton) deliveryTypeButton.addEventListener('click', () => selectAccountType('delivery'));

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
        if(storeFields) storeFields.classList.add('hidden');
        if(deliveryFields) deliveryFields.classList.add('hidden');

        if (type === 'user') {
            userTypeButton.classList.add('account-type-selected');
        } else if (type === 'store') {
            storeTypeButton.classList.add('account-type-selected');
            if(storeFields) storeFields.classList.remove('hidden');
        } else if (type === 'delivery') {
            deliveryTypeButton.classList.add('account-type-selected');
            if(deliveryFields) deliveryFields.classList.remove('hidden');
        }
    }

    async function handleLogin() {
        // IDs dos campos de input do seu HTML
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) { return showToast('Atenção', 'Por favor, preencha e-mail e senha.', 'error'); }

        try {
            // ===== A ÚNICA CORREÇÃO IMPORTANTE =====
            // Trocamos '/api/login' por '/api/perfil/login'
            const response = await fetch('http://localhost:3000/api/perfil/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (response.ok) {
                // Salvamos os dados que o backend nos deu
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                
                showToast('Sucesso!', 'Login realizado com sucesso!');

                // Redirecionamos para a página correta
                setTimeout(() => {
                    window.location.href = result.redirectTo || '/frontend/Clientes/Inicio.html';
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

        if (!nome || !email || !password) { return showToast('Atenção', 'Por favor, preencha nome, e-mail e senha.', 'error'); }
        if (password !== passwordConfirm) { return showToast('Atenção', 'As senhas não coincidem.', 'error'); }

        const dataToSend = {
            nome_completo: nome,
            email: email,
            password: password,
            role: selectedAccountType
        };

        if (selectedAccountType === 'store') {
            dataToSend.nome_loja = document.getElementById('store-name').value;
            if (!dataToSend.nome_loja) {
                return showToast('Atenção', 'Por favor, preencha o nome da loja.', 'error');
            }
        }
        
        try {
            // ===== A ÚNICA CORREÇÃO IMPORTANTE =====
            // Trocamos '/api/register' por '/api/perfil/register'
            const response = await fetch('http://localhost:3000/api/perfil/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();
            if (response.ok) {
                showToast('Sucesso!', 'Cadastro realizado! Você já pode fazer o login.');
                setTimeout(() => window.location.reload(), 2000);
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