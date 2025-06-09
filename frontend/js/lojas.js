import { getLojas } from './api/lojasApi.js';

// Função para criar o HTML de um card de loja (seu código original)
function criarCardLoja(loja) {
    const rating = 4.9;
    const reviewCount = 254;
    const distance = "2.5 km";
    const deliveryTime = "25-35 min";
    const deliveryFee = "R$ 5,99";

    return `
      <div class="store-card bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div class="relative">
              <img src="${loja.url_imagem || 'https://placehold.co/400x200'}" alt="Imagem da ${loja.nome}" class="w-full h-40 object-cover">
              <div class="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
          </div>
          <div class="p-4">
              <div class="flex justify-between items-start">
                  <h3 class="text-lg font-bold text-gray-800">${loja.nome}</h3>
                  <div class="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                      <span class="text-yellow-500 mr-1">★</span>
                      <span class="text-sm font-semibold text-gray-700">${rating}</span>
                  </div>
              </div>
              <p class="text-sm text-gray-500 mb-3">${reviewCount}+ avaliações</p>
              <div class="flex items-center text-sm text-gray-600 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  ${distance}
              </div>
              <div class="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  ${deliveryTime} • Entrega: ${deliveryFee}
              </div>
          </div>
      </div>
  `;
}

// Função principal que carrega as lojas (seu código original)
async function carregarLojas() {
    const containerLojas = document.getElementById('lojas-container');
    if (!containerLojas) {
        console.error('O elemento com ID "lojas-container" não foi encontrado no seu HTML.');
        return;
    }

    containerLojas.innerHTML = '<p class="text-center text-gray-500">Carregando lojas...</p>';
    const lojas = await getLojas();

    if (lojas.length === 0) {
        containerLojas.innerHTML = '<p class="text-center text-gray-500">Nenhuma loja encontrada no momento.</p>';
        return;
    }
    containerLojas.innerHTML = '';
    lojas.forEach(loja => {
        const cardHtml = criarCardLoja(loja);
        containerLojas.innerHTML += cardHtml;
    });
}

// ===== LÓGICA DO BOTÃO DE TESTE ADICIONADA AQUI =====
function setupTestButton() {
    const testButton = document.getElementById('add-test-item-btn');
    if (!testButton) return;

    testButton.addEventListener('click', () => {
        // Define um item de teste
        const testItem = {
            id: `prod_${Date.now()}`, // ID único para não agrupar sempre o mesmo
            nome: 'X-Burger Teste',
            preco: 25.50,
            loja_id: '12345', // ID da loja fictícia
            loja_nome: 'Lanchonete do Zé'
        };

        // Pega o carrinho atual, adiciona o item e salva de volta
        const cart = JSON.parse(localStorage.getItem('pedeai_cart')) || [];

        // Lógica para adicionar ou incrementar
        const itemExistente = cart.find(item => item.id === testItem.id);
        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            testItem.quantidade = 1;
            cart.push(testItem);
        }
        
        localStorage.setItem('pedeai_cart', JSON.stringify(cart));

        // Mostra a notificação de sucesso
        showToast('Sucesso!', `${testItem.nome} foi adicionado ao carrinho.`);

        // Força a atualização do header para mostrar o contador
        window.location.reload(); 
    });
}

// O evento que dispara tudo quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    carregarLojas();
    setupTestButton(); // Ativa nosso novo botão
});