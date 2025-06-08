// js/perfil.js

document.addEventListener('DOMContentLoaded', function() {
    // 1. O "Segurança" - Verifica se o usuário está logado
    const sessionJSON = localStorage.getItem('supabase.session');
    if (!sessionJSON) {
        alert("Acesso negado. Por favor, faça o login.");
        window.location.href = 'login.html';
        return; 
    }
    const user = JSON.parse(sessionJSON).user;

    // 2. Preenche os Dados na Tela
    if (user) {
        // Preenche o cabeçalho do perfil (os elementos que já tinham os IDs)
        const profileNameElement = document.getElementById('profile-name');
        const profileEmailElement = document.getElementById('profile-email');

        if (profileNameElement) {
            profileNameElement.textContent = user.user_metadata.full_name || 'Usuário';
        }
        if (profileEmailElement) {
            profileEmailElement.textContent = user.email;
        }

        // NOVIDADE: Preenche os campos DENTRO do formulário de Dados Pessoais
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        // Você pode adicionar mais campos aqui (telefone, cpf, etc.)
        const phoneInput = document.getElementById('phone');
        const cpfInput = document.getElementById('cpf');
        const birthdateInput = document.getElementById('birthdate');
        const genderSelect = document.getElementById('gender');


        if (nameInput) {
            nameInput.value = user.user_metadata.full_name || '';
        }
        if (emailInput) {
            emailInput.value = user.email || '';
        }
        
        // Exemplo de como preencher outros campos (se você tiver esses dados no user_metadata ou de outra forma)
        if (phoneInput && user.user_metadata.phone) {
            phoneInput.value = user.user_metadata.phone;
        }
        if (cpfInput && user.user_metadata.cpf) {
            cpfInput.value = user.user_metadata.cpf;
        }
        if (birthdateInput && user.user_metadata.birthdate) {
            birthdateInput.value = user.user_metadata.birthdate; // Certifique-se que o formato da data seja 'YYYY-MM-DD'
        }
        if (genderSelect && user.user_metadata.gender) {
            genderSelect.value = user.user_metadata.gender;
        }
    }
    
    // 3. A Lógica das Abas (que você já tinha e estava funcionando)
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            contents.forEach(content => {
                if (content) content.style.display = 'none';
            });
            
            const targetId = this.getAttribute('data-target');
            const targetContent = document.querySelector(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // Ativa a primeira aba ao carregar a página
    if (tabs.length > 0) {
        tabs[0].click();
    }
});