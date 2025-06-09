// frontend/js/Perfil.js

import { fetchPerfil, updatePerfil } from './api/perfilApi.js';

// Função para preencher os campos do formulário com os dados do usuário
function preencherFormulario(profile) {
    if (!profile) return;
    
    // Pega os elementos do HTML
    const profileNameElement = document.getElementById('profile-name');
    const profileEmailElement = document.getElementById('profile-email');
    const nameInputElement = document.getElementById('name');
    const emailInputElement = document.getElementById('email');
    const phoneInputElement = document.getElementById('phone');
    const cpfInputElement = document.getElementById('cpf');
    const birthdateInputElement = document.getElementById('birthdate');

    // Preenche os dados no cabeçalho do perfil e no formulário
    if (profileNameElement) profileNameElement.textContent = profile.nome_completo || 'Usuário';
    if (profileEmailElement) profileEmailElement.textContent = profile.email || '...';
    if (nameInputElement) nameInputElement.value = profile.nome_completo || '';
    if (emailInputElement) emailInputElement.value = profile.email || '';
    if (phoneInputElement) phoneInputElement.value = profile.telefone || '';
    if (cpfInputElement) cpfInputElement.value = profile.cpf || '';
    if (birthdateInputElement && profile.data_nascimento) {
        birthdateInputElement.value = profile.data_nascimento.split('T')[0]; // Formata a data para YYYY-MM-DD
    }
}

// Função para lidar com o envio do formulário
async function handleSalvarPerfil(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const profileData = {
        nome_completo: document.getElementById('name').value,
        telefone: document.getElementById('phone').value,
        // Adicione outros campos que você queira atualizar
    };

    console.log("Enviando para atualização:", profileData);
    const result = await updatePerfil(profileData);

    if (result && !result.error) {
        alert('Perfil atualizado com sucesso!');
        // Opcional: atualiza o nome no topo da página
        const profileNameElement = document.getElementById('profile-name');
        if (profileNameElement) profileNameElement.textContent = result.profile.nome_completo;
    } else {
        alert('Erro ao atualizar o perfil. Tente novamente.');
    }
}

// Função principal que é executada quando a página carrega
async function setupPaginaPerfil() {
    const profile = await fetchPerfil();

    if (profile) {
        preencherFormulario(profile);
    } else {
        // Se não conseguir buscar o perfil, talvez o usuário não esteja logado
        alert('Você precisa estar logado para ver seu perfil.');
        window.location.href = '/frontend/login.html';
        return;
    }

    // Adiciona o evento de clique ao botão de salvar do formulário
    const form = document.querySelector('#dados-pessoais form');
    if (form) {
        form.addEventListener('submit', handleSalvarPerfil);
    }

    // Lógica para as abas (Perfil, Endereços, etc.)
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove a classe 'active' de todas as abas e esconde todos os conteúdos
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');

            // Adiciona 'active' na aba clicada e mostra o conteúdo correspondente
            tab.classList.add('active');
            const target = document.querySelector(tab.dataset.target);
            if (target) {
                target.style.display = 'block';
            }
        });
    });
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', setupPaginaPerfil);